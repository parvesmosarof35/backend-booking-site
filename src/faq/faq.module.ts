import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqService } from './faq.service';
import { FaqController } from './faq.controller';
import { FAQ, FAQSchema } from '../database/schemas/faq.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FAQ.name, schema: FAQSchema }]),
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
