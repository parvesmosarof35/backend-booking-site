import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSettingsService } from './payment-settings.service';
import { PaymentSettingsController } from './payment-settings.controller';
import { PaymentSettings, PaymentSettingsSchema } from '../database/schemas/payment-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentSettings.name, schema: PaymentSettingsSchema },
    ]),
  ],
  controllers: [PaymentSettingsController],
  providers: [PaymentSettingsService],
  exports: [PaymentSettingsService],
})
export class PaymentSettingsModule {}
