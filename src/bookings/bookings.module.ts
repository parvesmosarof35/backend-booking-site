import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking, BookingSchema } from '../database/schemas/booking.schema';
import { Table, TableSchema } from '../database/schemas/table.schema';
import { Slot, SlotSchema } from '../database/schemas/slot.schema';
import { Shift, ShiftSchema } from '../database/schemas/shift.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Table.name, schema: TableSchema },
      { name: Slot.name, schema: SlotSchema },
      { name: Shift.name, schema: ShiftSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
