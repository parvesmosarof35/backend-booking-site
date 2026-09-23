import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTablePositionDto } from './dto/update-position.dto';
import { TableZone } from '../database/schemas/table.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @ApiOperation({ summary: 'Get all tables (optional zone filter)' })
  @ApiQuery({ name: 'zone', enum: TableZone, required: false })
  @Get()
  findAll(@Query('zone') zone?: TableZone) {
    return this.tablesService.findAll(zone);
  }

  @ApiOperation({ summary: 'Get floor plan tables grouped by zone' })
  @Get('floor-plan')
  getFloorPlan() {
    return this.tablesService.getFloorPlan();
  }

  @ApiOperation({ summary: 'Get single table by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new table' })
  @Post()
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update table details' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tablesService.update(id, updateTableDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update table canvas drag-and-drop position coordinates' })
  @Patch(':id/position')
  updatePosition(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdateTablePositionDto,
  ) {
    return this.tablesService.updatePosition(id, updatePositionDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete table' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
