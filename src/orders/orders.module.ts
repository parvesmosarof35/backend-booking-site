import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from '../database/schemas/order.schema';
import { MenuItem, MenuItemSchema } from '../database/schemas/menu-item.schema';
import { PaymentSettings, PaymentSettingsSchema } from '../database/schemas/payment-settings.schema';
import { Offer, OfferSchema } from '../database/schemas/offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: PaymentSettings.name, schema: PaymentSettingsSchema },
      { name: Offer.name, schema: OfferSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
