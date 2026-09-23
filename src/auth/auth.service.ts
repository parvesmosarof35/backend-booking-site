import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../database/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private logger = new Logger('AuthService');

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    try {
      const superAdminEmail =
        process.env.SUPER_ADMIN_EMAIL || 'parvesmosarof2@gmail.com';
      const existing = await this.userModel.findOne({ email: superAdminEmail.toLowerCase() });

      if (!existing) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
        const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
        const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

        await this.userModel.create({
          name: 'Super Admin',
          email: superAdminEmail.toLowerCase(),
          phone: '+8801700000000',
          passwordHash,
          role: UserRole.SUPERADMIN,
        });

        this.logger.log(`Superadmin user created successfully: ${superAdminEmail}`);
      } else {
        this.logger.log(`Superadmin user already exists: ${superAdminEmail}`);
      }
    } catch (error) {
      this.logger.error('Error seeding superadmin:', error);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: null });
    return { success: true, message: 'Logged out successfully' };
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret_123';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'refresh_secret_123';
    const expiresIn = process.env.EXPIRES_IN || '10d';
    const refreshExpiresIn = process.env.REFRESH_EXPIRES_IN || '30d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: expiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(refreshToken, saltRounds);
    await this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: hash });
  }
}
