import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentMethod } from '../database/schemas/order.schema';
import { MenuItem, MenuItemDocument } from '../database/schemas/menu-item.schema';
import { PaymentSettings, PaymentSettingsDocument } from '../database/schemas/payment-settings.schema';
import { Offer, OfferDocument, DiscountType } from '../database/schemas/offer.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(PaymentSettings.name)
    private paymentSettingsModel: Model<PaymentSettingsDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const settings = await this.paymentSettingsModel.findOne().exec();
    const isCodOnly = settings ? settings.codOnlyMode : false;

    // Fetch verified menu items from DB
    const itemIds = createOrderDto.items.map((i) => new Types.ObjectId(i.menuItemId));
    const dbItems = await this.menuItemModel.find({ _id: { $in: itemIds }, isAvailable: true }).exec();

    if (dbItems.length !== createOrderDto.items.length) {
      throw new BadRequestException('One or more selected menu items are unavailable or invalid');
    }

    const itemMap = new Map<string, MenuItemDocument>();
    dbItems.forEach((item) => itemMap.set(item._id.toString(), item));

    let subtotal = 0;
    const verifiedOrderItems = createOrderDto.items.map((cartItem) => {
      const dbItem = itemMap.get(cartItem.menuItemId);
      if (!dbItem) throw new BadRequestException(`Item not found`);
      const lineTotal = dbItem.price * cartItem.qty;
      subtotal += lineTotal;

      return {
        menuItemId: dbItem._id as Types.ObjectId,
        name: dbItem.name,
        qty: cartItem.qty,
        price: dbItem.price,
        imageUrl: dbItem.imageUrl || '',
      };
    });

    // Check discount promo code if provided
    let discount = 0;
    if (createOrderDto.promoCode) {
      const offer = await this.offerModel.findOne({
        promoCode: createOrderDto.promoCode.toUpperCase(),
        isActive: true,
      });

      if (offer) {
        if (offer.discountType === DiscountType.PERCENTAGE) {
          discount = (subtotal * offer.value) / 100;
        } else {
          discount = Math.min(offer.value, subtotal);
        }
      }
    }

    // Payment method & delivery charge rule logic
    let effectivePaymentMethod = createOrderDto.paymentMethod || PaymentMethod.COD;
    let effectiveDeliveryCharge = settings ? settings.deliveryCharge : 60;
    let effectiveTxId = createOrderDto.transactionId || '';

    if (isCodOnly) {
      effectivePaymentMethod = PaymentMethod.COD;
      effectiveDeliveryCharge = 0;
      effectiveTxId = '';
    } else {
      if (effectivePaymentMethod !== PaymentMethod.COD && !effectiveTxId) {
        throw new BadRequestException('Transaction/Reference ID is required for digital payments');
      }
    }

    if (createOrderDto.orderType === 'pickup') {
      effectiveDeliveryCharge = 0;
    }

    const total = Math.max(0, subtotal - discount + effectiveDeliveryCharge);

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${todayStr}-${randomSuffix}`;

    const order = await this.orderModel.create({
      orderNumber,
      items: verifiedOrderItems,
      customerName: createOrderDto.customerName,
      whatsapp: createOrderDto.whatsapp,
      address: createOrderDto.address,
      orderType: createOrderDto.orderType || 'delivery',
      paymentMethod: effectivePaymentMethod,
      transactionId: effectiveTxId,
      deliveryCharge: effectiveDeliveryCharge,
      subtotal,
      discount,
      total,
      status: OrderStatus.PENDING,
      notes: createOrderDto.notes || '',
    });

    this.eventsGateway.emitOrderCreated(order);

    return order;
  }

  async findAll(status?: OrderStatus): Promise<Order[]> {
    const query: any = {};
    if (status) query.status = status;
    return this.orderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderModel.findOne({ orderNumber }).exec();
    if (!order) {
      throw new NotFoundException(`Order #${orderNumber} not found`);
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const updated = await this.orderModel.findByIdAndUpdate(
      id,
      { status: dto.status },
      { new: true },
    ).exec();

    if (!updated) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    this.eventsGateway.emitOrderStatusChanged(updated);
    return updated;
  }
}
