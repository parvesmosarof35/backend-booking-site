import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContentPageDocument = ContentPage & Document;

export enum ContentPageType {
  PRIVACY_POLICY = 'privacy-policy',
  TERMS = 'terms',
  ABOUT_US = 'about-us',
}

@Schema({ timestamps: true })
export class ContentPage {
  @Prop({ required: true, unique: true, enum: ContentPageType })
  type: ContentPageType;

  @Prop({ required: true, default: '<p>Welcome to our restaurant.</p>' })
  content: string;
}

export const ContentPageSchema = SchemaFactory.createForClass(ContentPage);
