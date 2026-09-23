import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContentPage,
  ContentPageDocument,
  ContentPageType,
} from '../database/schemas/content-page.schema';
import { UpdateContentPageDto } from './dto/update-content-page.dto';

@Injectable()
export class ContentPagesService implements OnModuleInit {
  private logger = new Logger('ContentPagesService');

  constructor(
    @InjectModel(ContentPage.name)
    private contentPageModel: Model<ContentPageDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.contentPageModel.countDocuments();
    if (count === 0) {
      const initialPages = [
        {
          type: ContentPageType.ABOUT_US,
          content: `
            <h2>A Symphony of Flavor, Elegance & Modern Culinary Art</h2>
            <p>Welcome to <strong>The Royal Grand Bistro & Dine</strong>, where gastronomic artistry meets world-class hospitality in the heart of Dhaka. Established to redefine upscale fine dining, our restaurant brings together master chefs, organic local ingredients, and world-renowned culinary techniques.</p>
            <h3>Our Culinary Philosophy</h3>
            <p>Every dish is crafted with purpose. From our aged Australian prime steaks to delicate hand-rolled pastas and artisanal desserts, we celebrate flavor, balance, and presentation.</p>
            <h3>Atmosphere & Ambiance</h3>
            <p>Designed with serene mood lighting, rich brass textures, and botanical accents, our dining spaces offer the perfect backdrop for intimate romantic evenings, executive business lunches, and joyful family celebrations.</p>
          `,
        },
        {
          type: ContentPageType.PRIVACY_POLICY,
          content: `
            <h2>Privacy Policy</h2>
            <p>Last updated: September 2026</p>
            <p>At The Royal Grand Bistro, your privacy and data security are of the utmost importance to us. This policy outlines how we collect, handle, and protect your information when booking tables or placing food orders.</p>
            <h3>Information We Collect</h3>
            <ul>
              <li><strong>Contact Details:</strong> Your name, WhatsApp phone number, and optional email address.</li>
              <li><strong>Booking Details:</strong> Date, time slot, guest count, and seating preferences.</li>
              <li><strong>Order Details:</strong> Delivery address, ordered menu items, and payment transaction reference.</li>
            </ul>
            <h3>How We Use Your Data</h3>
            <p>We strictly use your information to facilitate table reservations, process food deliveries, send booking confirmation notices, and provide customer support.</p>
          `,
        },
        {
          type: ContentPageType.TERMS,
          content: `
            <h2>Terms & Conditions</h2>
            <p>Please read these terms and conditions carefully before placing table reservations or online orders.</p>
            <h3>Table Reservations</h3>
            <ul>
              <li>Temporary holds on tables last for 5 minutes during checkout.</li>
              <li>We hold confirmed tables for up to 15 minutes past the reserved time slot before releasing them to waitlist guests.</li>
              <li>Cancellations are appreciated at least 2 hours prior to your scheduled reservation.</li>
            </ul>
            <h3>Online Ordering & Payments</h3>
            <ul>
              <li>Cash on Delivery (COD) orders require full settlement upon courier arrival.</li>
              <li>Digital payments (bKash/Nagad/Rocket/Bank) must include a valid transaction reference for manual admin verification.</li>
            </ul>
          `,
        },
      ];

      await this.contentPageModel.insertMany(initialPages);
      this.logger.log('Initial CMS content pages seeded');
    }
  }

  async getPage(type: ContentPageType): Promise<ContentPage> {
    let page = await this.contentPageModel.findOne({ type }).exec();
    if (!page) {
      page = await this.contentPageModel.create({
        type,
        content: `<h2>${type.toUpperCase().replace(/-/g, ' ')}</h2><p>Content coming soon.</p>`,
      });
    }
    return page;
  }

  async updatePage(type: ContentPageType, dto: UpdateContentPageDto): Promise<ContentPage> {
    let page = await this.contentPageModel.findOne({ type }).exec();
    if (!page) {
      page = await this.contentPageModel.create({
        type,
        content: dto.content,
      });
      return page;
    }

    page.content = dto.content;
    return page.save();
  }

  async getAllPages(): Promise<ContentPage[]> {
    return this.contentPageModel.find().exec();
  }
}
