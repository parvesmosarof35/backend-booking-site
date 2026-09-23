import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentSettingsDocument = PaymentSettings & Document;

@Schema({ _id: false })
export class BankDetails {
  @Prop({ default: 'City Bank' })
  bankName: string;

  @Prop({ default: 'The Royal Grand Bistro' })
  accountName: string;

  @Prop({ default: '1234567890123' })
  accountNumber: string;

  @Prop({ default: 'Banani Branch, Dhaka' })
  branch: string;
}

export const BankDetailsSchema = SchemaFactory.createForClass(BankDetails);

@Schema({ timestamps: true })
export class PaymentSettings {
  @Prop({ default: false })
  codOnlyMode: boolean;

  @Prop({ default: '+8801700000001' })
  bkashNumber: string;

  @Prop({ default: '+8801800000002' })
  nagadNumber: string;

  @Prop({ default: '+8801900000003' })
  rocketNumber: string;

  @Prop({ type: BankDetailsSchema, default: () => ({}) })
  bankDetails: BankDetails;

  @Prop({ default: 60, min: 0 })
  deliveryCharge: number;
}

export const PaymentSettingsSchema = SchemaFactory.createForClass(PaymentSettings);
