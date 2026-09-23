import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { Booking, BookingDocument, BookingStatus } from '../database/schemas/booking.schema';
import { Table, TableDocument, TableStatus } from '../database/schemas/table.schema';
import { Slot, SlotDocument } from '../database/schemas/slot.schema';
import { Shift, ShiftDocument } from '../database/schemas/shift.schema';
import { HoldBookingDto } from './dto/hold-booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class BookingsService {
  private logger = new Logger('BookingsService');
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
    private eventsGateway: EventsGateway,
  ) {
    this.initMailer();
  }

  private initMailer() {
    const user = process.env.NODEMAILER_EMAIL;
    const pass = process.env.NODEMAILER_PASSWORD;
    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }
  }

  async holdBooking(dto: HoldBookingDto) {
    try {
      const { date, slotId, guestCount, preferredZone } = dto;
      const now = new Date();

      if (!slotId || !Types.ObjectId.isValid(slotId)) {
        throw new BadRequestException('Valid slot ID is required');
      }

      const slot = await this.slotModel.findById(slotId).exec();
      if (!slot || !slot.isActive) {
        throw new NotFoundException('Selected time slot not found or is inactive');
      }

      // Check shift capacity limit if shift exists
      if (slot.shiftId && Types.ObjectId.isValid(slot.shiftId.toString())) {
        const shift = await this.shiftModel.findById(slot.shiftId).exec();
        const activeBookingsCount = await this.bookingModel.countDocuments({
          date,
          slotId: new Types.ObjectId(slotId),
          $or: [
            { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.SEATED] } },
            { status: BookingStatus.HELD, holdExpiresAt: { $gt: now } },
          ],
        });

        if (slot.maxCapacity && activeBookingsCount >= slot.maxCapacity) {
          throw new ConflictException('This time slot is fully booked');
        }

        if (shift && shift.maxCapacity && activeBookingsCount >= shift.maxCapacity) {
          throw new ConflictException('This dining shift has reached maximum venue capacity');
        }
      }

      // Find booked/held tables safely
      const bookedBookings = await this.bookingModel
        .find({
          date,
          slotId: new Types.ObjectId(slotId),
          $or: [
            { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.SEATED] } },
            { status: BookingStatus.HELD, holdExpiresAt: { $gt: now } },
          ],
        })
        .select('tableId')
        .exec();

      const bookedTableIds: string[] = bookedBookings
        .map((b) => (b.tableId ? b.tableId.toString() : null))
        .filter((id): id is string => Boolean(id) && Types.ObjectId.isValid(id));

      const bookedObjectIds = bookedTableIds.map((id) => new Types.ObjectId(id));

      let assignedTable: TableDocument | null = null;

      if (dto.tableId) {
        if (!Types.ObjectId.isValid(dto.tableId)) {
          throw new BadRequestException('Invalid table ID format');
        }

        if (bookedTableIds.includes(dto.tableId)) {
          throw new ConflictException(
            'Selected table is already booked or on hold for this time slot. Please choose another table.',
          );
        }

        assignedTable = await this.tableModel.findById(dto.tableId).exec();
        if (!assignedTable || assignedTable.status === TableStatus.MAINTENANCE) {
          throw new BadRequestException('Selected table is currently under maintenance or unavailable');
        }

        if (assignedTable.capacity < Number(guestCount)) {
          throw new BadRequestException(
            `Selected table holds ${assignedTable.capacity} seats, but you selected ${guestCount} guests`,
          );
        }
      } else {
        // Auto-assign algorithm: find smallest fitting table
        const query: any = {
          capacity: { $gte: Number(guestCount || 2) },
          status: { $ne: TableStatus.MAINTENANCE },
        };

        if (bookedObjectIds.length > 0) {
          query._id = { $nin: bookedObjectIds };
        }

        if (preferredZone) {
          query.zone = preferredZone;
        }

        // First attempt with preferred zone
        let candidateTables = await this.tableModel
          .find(query)
          .sort({ capacity: 1 })
          .exec();

        // If no table found in preferred zone, fallback to any available zone
        if (candidateTables.length === 0 && preferredZone) {
          delete query.zone;
          candidateTables = await this.tableModel
            .find(query)
            .sort({ capacity: 1 })
            .exec();
        }

        // If still no table found, check if there are any tables at all in DB
        if (candidateTables.length === 0) {
          const totalTables = await this.tableModel.countDocuments();
          if (totalTables === 0) {
            // Seed a default table so booking works seamlessly on initial deployment
            const defaultTable = await this.tableModel.create({
              tableNumber: 'T-01',
              capacity: Math.max(4, Number(guestCount || 2)),
              zone: preferredZone || 'Indoor',
              shape: 'rect',
              status: TableStatus.AVAILABLE,
              positionX: 100,
              positionY: 100,
            });
            assignedTable = defaultTable;
          } else {
            throw new ConflictException(
              `No available table found for ${guestCount} guests at this time slot. Please select another time or party size.`,
            );
          }
        } else {
          assignedTable = candidateTables[0];
        }
      }

      if (!assignedTable) {
        throw new ConflictException('Unable to assign an available table for this reservation');
      }

      // 5-minute temporary hold
      const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

      const booking = await this.bookingModel.create({
        customerName: dto.customerName || 'Guest',
        whatsapp: dto.whatsapp || '',
        guestCount: Number(guestCount || 2),
        tableId: assignedTable._id,
        slotId: slot._id,
        date,
        status: BookingStatus.HELD,
        holdExpiresAt,
      });

      const populated = await this.bookingModel
        .findById(booking._id)
        .populate('tableId')
        .populate('slotId')
        .exec();

      try {
        this.eventsGateway.emitBookingCreated(populated);
      } catch (err) {
        this.logger.warn(`Failed to emit socket event: ${err}`);
      }

      return {
        message: 'Table reserved on temporary hold for 5 minutes',
        bookingId: booking._id,
        table: assignedTable,
        slot,
        date,
        holdExpiresAt,
        guestCount: Number(guestCount || 2),
      };
    } catch (err: any) {
      this.logger.error(`Error in holdBooking: ${err.message}`, err.stack);
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException ||
        err instanceof ConflictException
      ) {
        throw err;
      }
      throw new BadRequestException(err.message || 'Failed to process table hold request');
    }
  }

  async confirmBooking(dto: ConfirmBookingDto) {
    const { bookingId, customerName, whatsapp, email, specialRequests } = dto;

    if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
      throw new BadRequestException('Valid booking ID is required');
    }

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('tableId')
      .populate('slotId')
      .exec();

    if (!booking) {
      throw new NotFoundException('Reservation session not found');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      return { message: 'Booking already confirmed', booking };
    }

    const now = new Date();
    if (booking.status === BookingStatus.HELD && booking.holdExpiresAt && booking.holdExpiresAt < now) {
      throw new BadRequestException('Hold session expired. Please choose a slot again.');
    }

    const ref = `RES-${booking.date.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    booking.customerName = customerName;
    booking.whatsapp = whatsapp;
    if (email) booking.email = email;
    if (specialRequests) booking.specialRequests = specialRequests;
    booking.status = BookingStatus.CONFIRMED;
    booking.bookingReference = ref;
    booking.holdExpiresAt = null;

    const confirmed = await booking.save();

    // Increment slot booked count safely
    if (booking.slotId) {
      await this.slotModel.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: 1 } });
    }

    try {
      this.eventsGateway.emitBookingStatusChanged(confirmed);
    } catch {}

    // Send confirmation email asynchronously if configured
    if (email && this.transporter) {
      this.sendEmailConfirmation(email, confirmed).catch((err) => {
        this.logger.warn(`Failed to send email confirmation: ${err.message}`);
      });
    }

    return {
      success: true,
      message: 'Table reservation confirmed successfully!',
      booking: confirmed,
    };
  }

  private async sendEmailConfirmation(to: string, booking: any) {
    const tableNum = (booking.tableId as any)?.tableNumber || 'Assigned Table';
    const slotTime = `${(booking.slotId as any)?.startTime || ''} - ${(booking.slotId as any)?.endTime || ''}`;

    const mailOptions = {
      from: `"The Royal Grand Bistro" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject: `Reservation Confirmed - #${booking.bookingReference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #f59e0b; margin-top: 0;">Reservation Confirmation</h2>
          <p>Dear <strong>${booking.customerName}</strong>,</p>
          <p>Your table reservation has been successfully confirmed at <strong>The Royal Grand Bistro</strong>.</p>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
            <p style="margin: 6px 0;"><strong>Date:</strong> ${booking.date}</p>
            <p style="margin: 6px 0;"><strong>Time Slot:</strong> ${slotTime}</p>
            <p style="margin: 6px 0;"><strong>Table:</strong> ${tableNum}</p>
            <p style="margin: 6px 0;"><strong>Guests:</strong> ${booking.guestCount} Persons</p>
          </div>
          <p>For instant changes, contact us via WhatsApp: ${booking.whatsapp}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Thank you for dining with us!</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async findAll(date?: string, status?: string): Promise<Booking[]> {
    const query: any = {};
    if (date) query.date = date;
    if (status) query.status = status;

    return this.bookingModel
      .find(query)
      .populate('tableId')
      .populate({
        path: 'slotId',
        populate: { path: 'shiftId' },
      })
      .sort({ date: -1, createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Booking> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID format');
    }
    const booking = await this.bookingModel
      .findById(id)
      .populate('tableId')
      .populate({
        path: 'slotId',
        populate: { path: 'shiftId' },
      })
      .exec();

    if (!booking) {
      throw new NotFoundException(`Booking #${id} not found`);
    }
    return booking;
  }

  async findByReference(ref: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({ bookingReference: ref.trim().toUpperCase() })
      .populate('tableId')
      .populate({
        path: 'slotId',
        populate: { path: 'shiftId' },
      })
      .exec();

    if (!booking) {
      throw new NotFoundException(`Reservation with reference "${ref}" not found`);
    }
    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<Booking> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid booking ID format');
    }
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException(`Booking #${id} not found`);
    }

    const previousStatus = booking.status;
    booking.status = dto.status;
    const updated = await booking.save();

    if (dto.status === BookingStatus.CANCELLED && previousStatus === BookingStatus.CONFIRMED && booking.slotId) {
      await this.slotModel.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: -1 } });
    }

    const populated = await this.findOne(id);
    try {
      this.eventsGateway.emitBookingStatusChanged(populated);
    } catch {}
    return populated;
  }

  async getAvailableSlots(date: string, guestCount: number, zone?: string) {
    const now = new Date();
    const slots = await this.slotModel.find({ isActive: true }).populate('shiftId').sort({ startTime: 1 }).exec();

    const results = await Promise.all(
      slots.map(async (slot) => {
        const bookedBookings = await this.bookingModel
          .find({
            date,
            slotId: slot._id,
            $or: [
              { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.SEATED] } },
              { status: BookingStatus.HELD, holdExpiresAt: { $gt: now } },
            ],
          })
          .select('tableId')
          .exec();

        const bookedTableIds = bookedBookings
          .map((b) => (b.tableId ? b.tableId.toString() : null))
          .filter((id): id is string => Boolean(id) && Types.ObjectId.isValid(id));

        const bookedObjectIds = bookedTableIds.map((id) => new Types.ObjectId(id));

        const tableQuery: any = {
          capacity: { $gte: Number(guestCount || 2) },
          status: { $ne: TableStatus.MAINTENANCE },
        };

        if (bookedObjectIds.length > 0) {
          tableQuery._id = { $nin: bookedObjectIds };
        }

        if (zone) tableQuery.zone = zone;

        const availableTablesCount = await this.tableModel.countDocuments(tableQuery);

        return {
          slotId: slot._id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          shift: slot.shiftId,
          available: availableTablesCount > 0,
          availableTablesCount,
        };
      }),
    );

    return results;
  }

  async getFloorPlanStatus(date: string, slotId: string, guestCount: number = 2) {
    if (!slotId || !Types.ObjectId.isValid(slotId)) {
      return [];
    }

    const now = new Date();
    const tables = await this.tableModel.find().sort({ tableNumber: 1 }).exec();

    const activeBookings = await this.bookingModel
      .find({
        date,
        slotId: new Types.ObjectId(slotId),
        $or: [
          { status: { $in: [BookingStatus.CONFIRMED, BookingStatus.SEATED] } },
          { status: BookingStatus.HELD, holdExpiresAt: { $gt: now } },
        ],
      })
      .select('tableId status holdExpiresAt')
      .exec();

    const bookingMap = new Map<string, any>();
    activeBookings.forEach((b) => {
      if (b.tableId) {
        bookingMap.set(b.tableId.toString(), b);
      }
    });

    return tables.map((t) => {
      const activeBooking = bookingMap.get(t._id.toString());
      let seatStatus = 'available';

      if (t.status === TableStatus.MAINTENANCE) {
        seatStatus = 'maintenance';
      } else if (activeBooking) {
        seatStatus = activeBooking.status === BookingStatus.HELD ? 'held' : 'booked';
      } else if (t.capacity < Number(guestCount || 2)) {
        seatStatus = 'too_small';
      }

      return {
        _id: t._id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        type: t.type,
        zone: t.zone,
        positionX: t.positionX,
        positionY: t.positionY,
        shape: t.shape,
        status: seatStatus,
        isSelectable: seatStatus === 'available',
      };
    });
  }
}
