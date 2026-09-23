import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentSettings, PaymentSettingsDocument } from '../database/schemas/payment-settings.schema';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';

@Injectable()
export class PaymentSettingsService implements OnModuleInit {
  private logger = new Logger('PaymentSettingsService');

  constructor(
    @InjectModel(PaymentSettings.name)
    private paymentSettingsModel: Model<PaymentSettingsDocument>,
  ) {}

  async onModuleInit() {
    const existing = await this.paymentSettingsModel.findOne();
    if (!existing) {
      await this.paymentSettingsModel.create({
        codOnlyMode: false,
        bkashNumber: '+8801700000001 (Personal)',
        nagadNumber: '+8801800000002 (Merchant)',
        rocketNumber: '+8801900000003 (Personal)',
        bankDetails: {
          bankName: 'City Bank Ltd',
          accountName: 'The Royal Grand Bistro & Dine',
          accountNumber: '1234567890123',
          branch: 'Banani Branch, Dhaka',
        },
        deliveryCharge: 60,
      });
      this.logger.log('Default PaymentSettings initialized');
    }
  }

  async getSettings(): Promise<PaymentSettings> {
    let settings = await this.paymentSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.paymentSettingsModel.create({
        codOnlyMode: false,
      });
    }
    return settings;
  }

  async updateSettings(dto: UpdatePaymentSettingsDto): Promise<PaymentSettings> {
    let settings = await this.paymentSettingsModel.findOne().exec();
    if (!settings) {
      settings = await this.paymentSettingsModel.create(dto);
      return settings;
    }

    if (dto.codOnlyMode !== undefined) settings.codOnlyMode = dto.codOnlyMode;
    if (dto.bkashNumber !== undefined) settings.bkashNumber = dto.bkashNumber;
    if (dto.nagadNumber !== undefined) settings.nagadNumber = dto.nagadNumber;
    if (dto.rocketNumber !== undefined) settings.rocketNumber = dto.rocketNumber;
    if (dto.deliveryCharge !== undefined) settings.deliveryCharge = dto.deliveryCharge;
    if (dto.bankDetails) {
      settings.bankDetails = {
        ...settings.bankDetails,
        ...dto.bankDetails,
      };
    }

    return settings.save();
  }
}
