import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Track user view or click event (Public/Frontend)' })
  @Post('track')
  @HttpCode(HttpStatus.OK)
  track(@Body() trackEventDto: TrackEventDto) {
    return this.analyticsService.track(trackEventDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get top 10 most viewed and clicked items (Admin)' })
  @Get('top')
  getTopStats() {
    return this.analyticsService.getTopStats();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get 30-day views vs clicks time-series data' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  @Get('timeseries')
  getTimeSeries(@Query('days') days?: string) {
    return this.analyticsService.getTimeSeries(days ? parseInt(days, 10) : 30);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get dashboard KPI summary counters' })
  @Get('summary')
  getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
