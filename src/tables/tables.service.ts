import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument, TableZone, TableShape, TableStatus } from '../database/schemas/table.schema';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTablePositionDto } from './dto/update-position.dto';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class TablesService implements OnModuleInit {
  private logger = new Logger('TablesService');

  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    const count = await this.tableModel.countDocuments();
    if (count === 0) {
      const initialTables = [
        { tableNumber: 'T-01', capacity: 2, type: 'Window Table', zone: TableZone.INDOOR, positionX: 80, positionY: 80, shape: TableShape.ROUND, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-02', capacity: 2, type: 'Standard', zone: TableZone.INDOOR, positionX: 220, positionY: 80, shape: TableShape.ROUND, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-03', capacity: 4, type: 'Booth', zone: TableZone.INDOOR, positionX: 80, positionY: 220, shape: TableShape.SQUARE, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-04', capacity: 4, type: 'Standard', zone: TableZone.INDOOR, positionX: 220, positionY: 220, shape: TableShape.SQUARE, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-05', capacity: 6, type: 'Family Table', zone: TableZone.INDOOR, positionX: 380, positionY: 150, shape: TableShape.RECT, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-06', capacity: 8, type: 'Grand Table', zone: TableZone.INDOOR, positionX: 540, positionY: 150, shape: TableShape.RECT, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-07', capacity: 4, type: 'Garden View', zone: TableZone.OUTDOOR, positionX: 100, positionY: 100, shape: TableShape.ROUND, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-08', capacity: 6, type: 'Patio Long', zone: TableZone.OUTDOOR, positionX: 300, positionY: 100, shape: TableShape.RECT, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-09', capacity: 2, type: 'Skyline Table', zone: TableZone.ROOFTOP, positionX: 120, positionY: 120, shape: TableShape.ROUND, status: TableStatus.AVAILABLE },
        { tableNumber: 'T-10', capacity: 4, type: 'Sunset Vista', zone: TableZone.ROOFTOP, positionX: 280, positionY: 120, shape: TableShape.SQUARE, status: TableStatus.AVAILABLE },
        { tableNumber: 'VIP-01', capacity: 8, type: 'Private Suite', zone: TableZone.VIP, positionX: 150, positionY: 150, shape: TableShape.RECT, status: TableStatus.AVAILABLE },
      ];

      await this.tableModel.insertMany(initialTables);
      this.logger.log('Initial restaurant tables seeded successfully');
    }
  }

  async findAll(zone?: TableZone): Promise<Table[]> {
    const query = zone ? { zone } : {};
    return this.tableModel.find(query).sort({ tableNumber: 1 }).exec();
  }

  async getFloorPlan(): Promise<{ [key: string]: Table[] }> {
    const tables = await this.tableModel.find().exec();
    const grouped: { [key: string]: Table[] } = {
      [TableZone.INDOOR]: [],
      [TableZone.OUTDOOR]: [],
      [TableZone.ROOFTOP]: [],
      [TableZone.VIP]: [],
    };

    tables.forEach((t) => {
      if (grouped[t.zone]) {
        grouped[t.zone].push(t);
      } else {
        grouped[t.zone] = [t];
      }
    });

    return grouped;
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableModel.findById(id).exec();
    if (!table) {
      throw new NotFoundException(`Table #${id} not found`);
    }
    return table;
  }

  async create(createTableDto: CreateTableDto): Promise<Table> {
    const existing = await this.tableModel.findOne({ tableNumber: createTableDto.tableNumber });
    if (existing) {
      throw new ConflictException(`Table number ${createTableDto.tableNumber} already exists`);
    }

    const created = await this.tableModel.create(createTableDto);
    this.eventsGateway.emitTableUpdated(created);
    return created;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    if (updateTableDto.tableNumber) {
      const conflict = await this.tableModel.findOne({
        tableNumber: updateTableDto.tableNumber,
        _id: { $ne: id },
      });
      if (conflict) {
        throw new ConflictException(`Table number ${updateTableDto.tableNumber} already exists`);
      }
    }

    const updated = await this.tableModel.findByIdAndUpdate(id, updateTableDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException(`Table #${id} not found`);
    }

    this.eventsGateway.emitTableUpdated(updated);
    return updated;
  }

  async updatePosition(id: string, dto: UpdateTablePositionDto): Promise<Table> {
    const table = await this.tableModel.findById(id);
    if (!table) {
      throw new NotFoundException(`Table #${id} not found`);
    }

    table.positionX = dto.positionX;
    table.positionY = dto.positionY;
    if (dto.zone) {
      table.zone = dto.zone;
    }

    const saved = await table.save();
    this.eventsGateway.emitTableUpdated(saved);
    return saved;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.tableModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Table #${id} not found`);
    }
    this.eventsGateway.emitTableUpdated({ _id: id, deleted: true });
    return { success: true, message: `Table #${id} deleted successfully` };
  }
}
