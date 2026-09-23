import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OfferDocument = Offer & Document;

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: DiscountType, default: DiscountType.PERCENTAGE })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '' })
  promoCode: string;

  @Prop({ required: true })
  validFrom: string; // YYYY-MM-DD

  @Prop({ required: true })
  validTo: string; // YYYY-MM-DD

  @Prop({ default: 'all' })
  appliesTo: string; // 'all' | 'dine-in' | 'delivery'

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  clickCount: number;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
