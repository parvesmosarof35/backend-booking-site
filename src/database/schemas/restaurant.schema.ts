import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true, default: 'The Royal Grand Bistro & Dine' })
  name: string;

  @Prop({ default: '' })
  logoUrl: string;

  @Prop({ default: 'Road 11, Banani, Dhaka 1213, Bangladesh' })
  address: string;

  @Prop({ default: '+880 1712-345678' })
  phone: string;

  @Prop({ default: 'Mon - Sun: 11:00 AM - 11:30 PM' })
  openingHours: string;

  @Prop({ default: 'Experience modern culinary excellence, serene ambiance, and unparalleled hospitality at our signature restaurant.' })
  description: string;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);
