import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem, MenuItemDocument } from '../database/schemas/menu-item.schema';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService implements OnModuleInit {
  private logger = new Logger('MenuService');

  constructor(
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.menuItemModel.countDocuments();
    if (count === 0) {
      const initialItems = [
        {
          name: 'Prime Grilled Ribeye Steak',
          description: 'Aged Black Angus ribeye (300g) served with truffle mashed potatoes, grilled asparagus, and red wine jus.',
          price: 1850,
          category: 'Main Course',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: true,
          viewCount: 142,
          clickCount: 56,
        },
        {
          name: 'Pan-Seared Norwegian Salmon',
          description: 'Crispy skin salmon fillet resting on lemon dill risotto with saffron beurre blanc.',
          price: 1650,
          category: 'Main Course',
          imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: true,
          viewCount: 98,
          clickCount: 42,
        },
        {
          name: 'Truffle Mushroom Fettuccine',
          description: 'Handcrafted egg fettuccine tossed in white truffle oil, wild porcini mushrooms, and aged Parmigiano Reggiano.',
          price: 950,
          category: 'Pasta',
          imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: true,
          viewCount: 120,
          clickCount: 65,
        },
        {
          name: 'Artisan Burrata Salad',
          description: 'Fresh Italian burrata cheese, heirloom cherry tomatoes, basil pesto drizzle, and balsamic reduction.',
          price: 780,
          category: 'Appetizers',
          imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: false,
          viewCount: 75,
          clickCount: 30,
        },
        {
          name: 'Crispy Calamari Fritti',
          description: 'Golden fried tender calamari rings served with smoked paprika aioli and charred lemon wedges.',
          price: 680,
          category: 'Appetizers',
          imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: false,
          viewCount: 88,
          clickCount: 44,
        },
        {
          name: 'Classic Chocolate Lava Cake',
          description: 'Warm Belgian dark chocolate molten cake served with Madagascar vanilla bean gelato.',
          price: 520,
          category: 'Desserts',
          imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: true,
          viewCount: 160,
          clickCount: 89,
        },
        {
          name: 'Signature Passionfruit Mocktail',
          description: 'Fresh passionfruit pulp, crushed mint, sparkling elderflower water, and lime twist.',
          price: 380,
          category: 'Beverages',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
          isAvailable: true,
          isFeatured: false,
          viewCount: 110,
          clickCount: 50,
        },
      ];

      await this.menuItemModel.insertMany(initialItems);
      this.logger.log('Initial restaurant menu items seeded');
    } else {
      // Ensure any existing record with the old/broken image URL is updated
      await this.menuItemModel.updateMany(
        {
          name: 'Truffle Mushroom Fettuccine',
          $or: [
            { imageUrl: { $regex: 'photo-1621996346565' } },
            { imageUrl: { $exists: false } },
            { imageUrl: '' },
          ],
        },
        {
          $set: {
            imageUrl:
              'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800&auto=format&fit=crop&q=80',
          },
        },
      );
    }
  }

  async findAll(category?: string, search?: string, isAvailable?: boolean): Promise<MenuItem[]> {
    const query: any = {};
    if (category && category !== 'All') query.category = category;
    if (isAvailable !== undefined) query.isAvailable = isAvailable;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    return this.menuItemModel.find(query).sort({ category: 1, createdAt: -1 }).exec();
  }

  async findFeatured(): Promise<MenuItem[]> {
    return this.menuItemModel.find({ isFeatured: true, isAvailable: true }).exec();
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.menuItemModel.distinct('category').exec();
    return categories;
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Menu item #${id} not found`);
    }
    return item;
  }

  async create(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    return this.menuItemModel.create(createMenuItemDto);
  }

  async update(id: string, updateMenuItemDto: UpdateMenuItemDto): Promise<MenuItem> {
    const updated = await this.menuItemModel
      .findByIdAndUpdate(id, updateMenuItemDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Menu item #${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.menuItemModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Menu item #${id} not found`);
    }
    return { success: true, message: `Menu item #${id} deleted` };
  }

  async incrementCount(id: string, type: 'view' | 'click') {
    const field = type === 'view' ? 'viewCount' : 'clickCount';
    return this.menuItemModel.findByIdAndUpdate(
      id,
      { $inc: { [field]: 1 } },
      { new: true },
    );
  }
}
