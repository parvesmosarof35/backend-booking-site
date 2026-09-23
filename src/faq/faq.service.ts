import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FAQ, FAQDocument } from '../database/schemas/faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ReorderFaqDto } from './dto/reorder-faq.dto';

@Injectable()
export class FaqService implements OnModuleInit {
  private logger = new Logger('FaqService');

  constructor(@InjectModel(FAQ.name) private faqModel: Model<FAQDocument>) {}

  async onModuleInit() {
    const count = await this.faqModel.countDocuments();
    if (count === 0) {
      const initialFaqs = [
        {
          question: 'How do table reservations work on this site?',
          answer: 'Select your preferred date, party size, and dining shift. Our system automatically allocates the ideal table layout for your group. You have 5 minutes to complete your reservation details with instant WhatsApp confirmation.',
          order: 1,
          isActive: true,
        },
        {
          question: 'Can I cancel or modify my reservation?',
          answer: 'Yes! You can contact us via our WhatsApp hotline or call our reservation desk directly. We request at least 2 hours advance notice for cancellations.',
          order: 2,
          isActive: true,
        },
        {
          question: 'What payment options do you support for online food delivery?',
          answer: 'We support Cash on Delivery (COD) as well as direct mobile banking via bKash, Nagad, Rocket, and Bank transfer. Simply enter your transaction reference ID during checkout.',
          order: 3,
          isActive: true,
        },
        {
          question: 'Is parking available at the venue?',
          answer: 'Yes, complimentary secure valet parking is provided for all dine-in guests at our Banani premises.',
          order: 4,
          isActive: true,
        },
      ];

      await this.faqModel.insertMany(initialFaqs);
      this.logger.log('Initial FAQs seeded successfully');
    }
  }

  async findAll(activeOnly: boolean = false): Promise<FAQ[]> {
    const query: any = {};
    if (activeOnly) {
      query.isActive = true;
    }
    return this.faqModel.find(query).sort({ order: 1, createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<FAQ> {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException(`FAQ #${id} not found`);
    }
    return faq;
  }

  async create(createFaqDto: CreateFaqDto): Promise<FAQ> {
    const count = await this.faqModel.countDocuments();
    const order = createFaqDto.order !== undefined ? createFaqDto.order : count + 1;
    return this.faqModel.create({ ...createFaqDto, order });
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<FAQ> {
    const updated = await this.faqModel.findByIdAndUpdate(id, updateFaqDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException(`FAQ #${id} not found`);
    }
    return updated;
  }

  async reorder(dto: ReorderFaqDto): Promise<{ success: boolean; message: string }> {
    const bulkOps = dto.items.map((item) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(item.id) },
        update: { $set: { order: item.order } },
      },
    }));

    if (bulkOps.length > 0) {
      await this.faqModel.bulkWrite(bulkOps);
    }

    return { success: true, message: 'FAQ order updated successfully' };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.faqModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`FAQ #${id} not found`);
    }
    return { success: true, message: `FAQ #${id} deleted` };
  }
}
