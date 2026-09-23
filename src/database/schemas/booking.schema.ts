import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  HELD = 'held',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ default: 'Guest', trim: true })
  customerName: string;

  @Prop({ default: '', trim: true })
  whatsapp: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ required: true, min: 1 })
  guestCount: number;

  @Prop({ type: Types.ObjectId, ref: 'Table', required: true })
  tableId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Slot', required: true })
  slotId: Types.ObjectId;

  @Prop({ required: true })
  date: string; // YYYY-MM-DD

  @Prop({ enum: BookingStatus, default: BookingStatus.HELD })
  status: BookingStatus;

  @Prop({ default: null })
  holdExpiresAt: Date;

  @Prop({ default: '' })
  specialRequests: string;

  @Prop({ default: '' })
  bookingReference: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ date: 1, slotId: 1, tableId: 1, status: 1 });
