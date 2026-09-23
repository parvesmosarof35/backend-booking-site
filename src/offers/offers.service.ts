import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer, OfferDocument, DiscountType } from '../database/schemas/offer.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService implements OnModuleInit {
  private logger = new Logger('OffersService');

  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.offerModel.countDocuments();
    if (count === 0) {
      const initialOffers = [
        {
          title: 'Royal Dine 20% Off Weekend Special',
          description: 'Receive 20% off all main courses and signature steaks when reserving a weekend table.',
          discountType: DiscountType.PERCENTAGE,
          value: 20,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
          promoCode: 'ROYAL20',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          appliesTo: 'all',
          isActive: true,
          viewCount: 210,
          clickCount: 84,
        },
        {
          title: 'Flat ৳300 Off on First Online Order',
          description: 'Get an instant ৳300 flat discount on orders over ৳1500 using our online ordering.',
          discountType: DiscountType.FLAT,
          value: 300,
          imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
          promoCode: 'FIRST300',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          appliesTo: 'delivery',
          isActive: true,
          viewCount: 165,
          clickCount: 92,
        },
        {
          title: 'Complimentary Lava Cake with VIP Booking',
          description: 'Book our VIP suite or family table of 6+ guests to receive complimentary lava desserts.',
          discountType: DiscountType.PERCENTAGE,
          value: 100,
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
          promoCode: 'VIREATS',
          validFrom: '2026-01-01',
          validTo: '2026-12-31',
          appliesTo: 'dine-in',
          isActive: true,
          viewCount: 130,
          clickCount: 45,
        },
      ];

      await this.offerModel.insertMany(initialOffers);
      this.logger.log('Initial promotional offers seeded');
    }
  }

  async findAll(onlyActive: boolean = false): Promise<Offer[]> {
    const query: any = {};
    if (onlyActive) {
      query.isActive = true;
    }
    return this.offerModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) {
      throw new NotFoundException(`Offer #${id} not found`);
    }
    return offer;
  }

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    return this.offerModel.create(createOfferDto);
  }

  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const updated = await this.offerModel.findByIdAndUpdate(id, updateOfferDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException(`Offer #${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.offerModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Offer #${id} not found`);
    }
    return { success: true, message: `Offer #${id} deleted` };
  }

  async incrementCount(id: string, type: 'view' | 'click') {
    const field = type === 'view' ? 'viewCount' : 'clickCount';
    return this.offerModel.findByIdAndUpdate(
      id,
      { $inc: { [field]: 1 } },
      { new: true },
    );
  }
}
