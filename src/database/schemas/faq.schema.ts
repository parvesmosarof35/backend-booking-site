import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FAQDocument = FAQ & Document;

@Schema({ timestamps: true })
export class FAQ {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const FAQSchema = SchemaFactory.createForClass(FAQ);
FAQSchema.index({ order: 1 });
