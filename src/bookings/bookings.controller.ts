import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { HoldBookingDto } from './dto/hold-booking.dto';
import { ConfirmBookingDto } from './dto/confirm-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Hold a table/slot for 5 minutes (Public)' })
  @Post('hold')
  @HttpCode(HttpStatus.OK)
  holdBooking(@Body() holdBookingDto: HoldBookingDto) {
    return this.bookingsService.holdBooking(holdBookingDto);
  }

  @ApiOperation({ summary: 'Confirm a held table reservation (Public)' })
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  confirmBooking(@Body() confirmBookingDto: ConfirmBookingDto) {
    return this.bookingsService.confirmBooking(confirmBookingDto);
  }

  @ApiOperation({ summary: 'Get available slots for a given date and guest count (Public)' })
  @ApiQuery({ name: 'date', example: '2026-09-25' })
  @ApiQuery({ name: 'guestCount', example: 2 })
  @ApiQuery({ name: 'zone', required: false })
  @Get('available-slots')
  getAvailableSlots(
    @Query('date') date: string,
    @Query('guestCount') guestCount: string,
    @Query('zone') zone?: string,
  ) {
    return this.bookingsService.getAvailableSlots(
      date || new Date().toISOString().split('T')[0],
      parseInt(guestCount || '2', 10),
      zone,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all bookings with optional date/status filter (Admin/Staff)' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Get()
  findAll(@Query('date') date?: string, @Query('status') status?: string) {
    return this.bookingsService.findAll(date, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get single booking by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update booking status (seated/completed/cancelled)' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto);
  }
}
