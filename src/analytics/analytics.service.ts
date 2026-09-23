import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
  AnalyticsEventType,
  AnalyticsTargetType,
} from '../database/schemas/analytics-event.schema';
import { MenuItem, MenuItemDocument } from '../database/schemas/menu-item.schema';
import { Offer, OfferDocument } from '../database/schemas/offer.schema';
import { Booking, BookingDocument, BookingStatus } from '../database/schemas/booking.schema';
import { Order, OrderDocument } from '../database/schemas/order.schema';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  private logger = new Logger('AnalyticsService');

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private eventModel: Model<AnalyticsEventDocument>,
    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Offer.name)
    private offerModel: Model<OfferDocument>,
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  async track(dto: TrackEventDto) {
    // 1. Log event in time-series collection
    const event = await this.eventModel.create({
      type: dto.type,
      targetType: dto.targetType,
      targetId: dto.targetId,
      meta: dto.meta || {},
    });

    // 2. Increment counters on target document
    const incrementField = dto.type === AnalyticsEventType.VIEW ? 'viewCount' : 'clickCount';

    if (dto.targetType === AnalyticsTargetType.MENU_ITEM) {
      await this.menuItemModel.findByIdAndUpdate(dto.targetId, {
        $inc: { [incrementField]: 1 },
      });
    } else if (dto.targetType === AnalyticsTargetType.OFFER) {
      await this.offerModel.findByIdAndUpdate(dto.targetId, {
        $inc: { [incrementField]: 1 },
      });
    }

    return { success: true, eventId: event._id };
  }

  async getTopStats() {
    const [topViewedMenu, topClickedMenu, topViewedOffers, topClickedOffers] =
      await Promise.all([
        this.menuItemModel
          .find()
          .sort({ viewCount: -1 })
          .limit(10)
          .select('name category price viewCount clickCount imageUrl')
          .exec(),
        this.menuItemModel
          .find()
          .sort({ clickCount: -1 })
          .limit(10)
          .select('name category price viewCount clickCount imageUrl')
          .exec(),
        this.offerModel
          .find()
          .sort({ viewCount: -1 })
          .limit(10)
          .select('title promoCode value viewCount clickCount')
          .exec(),
        this.offerModel
          .find()
          .sort({ clickCount: -1 })
          .limit(10)
          .select('title promoCode value viewCount clickCount')
          .exec(),
      ]);

    return {
      topViewedMenu,
      topClickedMenu,
      topViewedOffers,
      topClickedOffers,
    };
  }

  async getTimeSeries(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const events = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    // Map out into continuous day points
    const dateMap = new Map<string, { date: string; views: number; clicks: number }>();

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, { date: dateStr, views: 0, clicks: 0 });
    }

    events.forEach((item) => {
      const dateStr = item._id.date;
      if (dateMap.has(dateStr)) {
        const entry = dateMap.get(dateStr)!;
        if (item._id.type === AnalyticsEventType.VIEW) {
          entry.views = item.count;
        } else if (item._id.type === AnalyticsEventType.CLICK) {
          entry.clicks = item.count;
        }
      }
    });

    return Array.from(dateMap.values());
  }

  async getDashboardSummary() {
    const today = new Date().toISOString().split('T')[0];

    const [
      totalBookings,
      confirmedBookingsToday,
      totalOrders,
      totalRevenueResult,
      totalViews,
      totalClicks,
    ] = await Promise.all([
      this.bookingModel.countDocuments({ status: { $ne: BookingStatus.CANCELLED } }),
      this.bookingModel.countDocuments({ date: today, status: BookingStatus.CONFIRMED }),
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      this.eventModel.countDocuments({ type: AnalyticsEventType.VIEW }),
      this.eventModel.countDocuments({ type: AnalyticsEventType.CLICK }),
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    return {
      totalBookings,
      confirmedBookingsToday,
      totalOrders,
      totalRevenue,
      totalViews,
      totalClicks,
    };
  }
}
