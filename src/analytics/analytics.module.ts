import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from '../database/schemas/analytics-event.schema';
import { MenuItem, MenuItemSchema } from '../database/schemas/menu-item.schema';
import { Offer, OfferSchema } from '../database/schemas/offer.schema';
import { Booking, BookingSchema } from '../database/schemas/booking.schema';
import { Order, OrderSchema } from '../database/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
