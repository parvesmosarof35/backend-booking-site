import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ enum: UserRole, default: UserRole.STAFF })
  role: UserRole;

  @Prop({ default: null })
  refreshTokenHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
