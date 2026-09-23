import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SlotDocument = Slot & Document;

@Schema({ timestamps: true })
export class Slot {
  @Prop({ type: Types.ObjectId, ref: 'Shift', required: true, index: true })
  shiftId: Types.ObjectId;

  @Prop({ required: true })
  startTime: string; // e.g. "12:00"

  @Prop({ required: true })
  endTime: string; // e.g. "13:00"

  @Prop({ default: 0 })
  bookedCount: number;

  @Prop({ default: 30 })
  maxCapacity: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const SlotSchema = SchemaFactory.createForClass(Slot);
