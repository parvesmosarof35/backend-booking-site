import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TableDocument = Table & Document;

export enum TableZone {
  INDOOR = 'Indoor',
  OUTDOOR = 'Outdoor',
  ROOFTOP = 'Rooftop',
  VIP = 'VIP',
}

export enum TableShape {
  ROUND = 'round',
  SQUARE = 'square',
  RECT = 'rect',
}

export enum TableStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

@Schema({ timestamps: true })
export class Table {
  @Prop({ required: true, trim: true })
  tableNumber: string;

  @Prop({ required: true, min: 1 })
  capacity: number;

  @Prop({ default: 'Standard' })
  type: string;

  @Prop({ enum: TableZone, default: TableZone.INDOOR })
  zone: TableZone;

  @Prop({ default: 50 })
  positionX: number;

  @Prop({ default: 50 })
  positionY: number;

  @Prop({ enum: TableShape, default: TableShape.ROUND })
  shape: TableShape;

  @Prop({ enum: TableStatus, default: TableStatus.AVAILABLE })
  status: TableStatus;
}

export const TableSchema = SchemaFactory.createForClass(Table);
