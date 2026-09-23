import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../database/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-passwordHash -refreshTokenHash').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-passwordHash -refreshTokenHash').exec();
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ email: createUserDto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    const newUser = new this.userModel({
      name: createUserDto.name,
      email: createUserDto.email.toLowerCase(),
      phone: createUserDto.phone || '',
      passwordHash,
      role: createUserDto.role || UserRole.STAFF,
    });

    const saved = await newUser.save();
    return this.findOne(saved._id.toString());
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email) {
      const emailConflict = await this.userModel.findOne({ email: updateUserDto.email.toLowerCase() });
      if (emailConflict) {
        throw new ConflictException('Email already in use');
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
    if (updateUserDto.role) user.role = updateUserDto.role;

    if (updateUserDto.password) {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
      user.passwordHash = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    await user.save();
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete superadmin account');
    }

    await this.userModel.findByIdAndDelete(id);
    return { success: true, message: `User #${id} deleted successfully` };
  }
}
