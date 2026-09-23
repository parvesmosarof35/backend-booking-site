import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

export enum AnalyticsEventType {
  VIEW = 'view',
  CLICK = 'click',
}

export enum AnalyticsTargetType {
  MENU_ITEM = 'menuItem',
  OFFER = 'offer',
  PAGE = 'page',
  CTA = 'cta',
}

@Schema({ timestamps: true })
export class AnalyticsEvent {
  @Prop({ required: true, enum: AnalyticsEventType })
  type: AnalyticsEventType;

  @Prop({ required: true, enum: AnalyticsTargetType })
  targetType: AnalyticsTargetType;

  @Prop({ required: true })
  targetId: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  meta: Record<string, any>;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);
AnalyticsEventSchema.index({ type: 1, targetType: 1, createdAt: 1 });
