import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShiftDocument = Shift & Document;

@Schema({ timestamps: true })
export class Shift {
  @Prop({ required: true, trim: true })
  name: string; // e.g. Lunch, Evening Tea, Dinner

  @Prop({ required: true })
  startTime: string; // e.g. "12:00"

  @Prop({ required: true })
  endTime: string; // e.g. "16:00"

  @Prop({ required: true, default: 50 })
  maxCapacity: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);
