import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { TablesModule } from './tables/tables.module';
import { ShiftsModule } from './shifts/shifts.module';
import { BookingsModule } from './bookings/bookings.module';
import { MenuModule } from './menu/menu.module';
import { OffersModule } from './offers/offers.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentSettingsModule } from './payment-settings/payment-settings.module';
import { ContentPagesModule } from './content-pages/content-pages.module';
import { FaqModule } from './faq/faq.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';
import { EventsModule } from './gateway/events.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRoot(
      process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/booking-site',
    ),
    EventsModule,
    AuthModule,
    UsersModule,
    RestaurantModule,
    TablesModule,
    ShiftsModule,
    BookingsModule,
    MenuModule,
    OffersModule,
    OrdersModule,
    PaymentSettingsModule,
    ContentPagesModule,
    FaqModule,
    AnalyticsModule,
    UploadsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
