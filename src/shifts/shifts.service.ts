import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Shift, ShiftDocument } from '../database/schemas/shift.schema';
import { Slot, SlotDocument } from '../database/schemas/slot.schema';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { GenerateSlotsDto } from './dto/generate-slots.dto';

@Injectable()
export class ShiftsService implements OnModuleInit {
  private logger = new Logger('ShiftsService');

  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
    @InjectModel(Slot.name) private slotModel: Model<SlotDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.shiftModel.countDocuments();
    if (count === 0) {
      const lunchShift = await this.shiftModel.create({
        name: 'Lunch Shift',
        startTime: '12:00',
        endTime: '16:00',
        maxCapacity: 60,
        isActive: true,
      });

      const dinnerShift = await this.shiftModel.create({
        name: 'Dinner Shift',
        startTime: '18:00',
        endTime: '23:00',
        maxCapacity: 80,
        isActive: true,
      });

      await this.generateSlots(lunchShift._id.toString(), { intervalMinutes: 60, slotCapacity: 30 });
      await this.generateSlots(dinnerShift._id.toString(), { intervalMinutes: 60, slotCapacity: 40 });

      this.logger.log('Initial shifts and slots initialized');
    }
  }

  async findAll(): Promise<Shift[]> {
    return this.shiftModel.find().sort({ startTime: 1 }).exec();
  }

  async findOne(id: string): Promise<Shift> {
    const shift = await this.shiftModel.findById(id).exec();
    if (!shift) {
      throw new NotFoundException(`Shift #${id} not found`);
    }
    return shift;
  }

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const shift = await this.shiftModel.create(createShiftDto);
    // Automatically generate 60 min slots by default
    await this.generateSlots(shift._id.toString(), {
      intervalMinutes: 60,
      slotCapacity: Math.floor(shift.maxCapacity / 2),
    });
    return shift;
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const updated = await this.shiftModel.findByIdAndUpdate(id, updateShiftDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException(`Shift #${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.shiftModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Shift #${id} not found`);
    }
    await this.slotModel.deleteMany({ shiftId: new Types.ObjectId(id) }).exec();
    return { success: true, message: `Shift #${id} and associated slots deleted` };
  }

  async getShiftSlots(shiftId: string): Promise<Slot[]> {
    await this.findOne(shiftId);
    return this.slotModel.find({ shiftId: new Types.ObjectId(shiftId), isActive: true }).sort({ startTime: 1 }).exec();
  }

  async getAllSlots(): Promise<Slot[]> {
    return this.slotModel.find({ isActive: true }).populate('shiftId').sort({ startTime: 1 }).exec();
  }

  async generateSlots(shiftId: string, dto: GenerateSlotsDto): Promise<Slot[]> {
    const shift = await this.findOne(shiftId);

    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (endTotal <= startTotal) {
      throw new BadRequestException('End time must be after start time');
    }

    // Clear existing slots for this shift
    await this.slotModel.deleteMany({ shiftId: new Types.ObjectId(shiftId) }).exec();

    const slotsToCreate: any[] = [];
    let current = startTotal;
    const interval = dto.intervalMinutes;
    const capacity = dto.slotCapacity || Math.floor(shift.maxCapacity / 2);

    while (current + interval <= endTotal) {
      const sH = String(Math.floor(current / 60)).padStart(2, '0');
      const sM = String(current % 60).padStart(2, '0');
      const nextTime = current + interval;
      const eH = String(Math.floor(nextTime / 60)).padStart(2, '0');
      const eM = String(nextTime % 60).padStart(2, '0');

      slotsToCreate.push({
        shiftId: new Types.ObjectId(shiftId),
        startTime: `${sH}:${sM}`,
        endTime: `${eH}:${eM}`,
        bookedCount: 0,
        maxCapacity: capacity,
        isActive: true,
      });

      current += interval;
    }

    return this.slotModel.insertMany(slotsToCreate) as unknown as Slot[];
  }
}
