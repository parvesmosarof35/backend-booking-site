import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Restaurant, RestaurantDocument } from '../database/schemas/restaurant.schema';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService implements OnModuleInit {
  private logger = new Logger('RestaurantService');

  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
  ) {}

  async onModuleInit() {
    const existing = await this.restaurantModel.findOne();
    if (!existing) {
      await this.restaurantModel.create({
        name: 'The Royal Grand Bistro & Dine',
        logoUrl: '',
        address: 'Road 11, Block D, Banani, Dhaka 1213, Bangladesh',
        phone: '+880 1712-345678',
        openingHours: 'Mon - Sun: 11:00 AM - 11:30 PM',
        description:
          'Experience modern culinary excellence, serene ambiance, and unparalleled hospitality at our signature luxury restaurant.',
      });
      this.logger.log('Default restaurant profile initialized');
    }
  }

  async getProfile(): Promise<Restaurant> {
    let profile = await this.restaurantModel.findOne().exec();
    if (!profile) {
      profile = await this.restaurantModel.create({
        name: 'The Royal Grand Bistro & Dine',
      });
    }
    return profile;
  }

  async updateProfile(dto: UpdateRestaurantDto): Promise<Restaurant> {
    let profile = await this.restaurantModel.findOne().exec();
    if (!profile) {
      profile = await this.restaurantModel.create(dto);
      return profile;
    }

    Object.assign(profile, dto);
    return profile.save();
  }
}
