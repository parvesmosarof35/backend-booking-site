import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ContentPagesService } from './content-pages.service';
import { UpdateContentPageDto } from './dto/update-content-page.dto';
import { ContentPageType } from '../database/schemas/content-page.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('Content Pages (CMS)')
@Controller('content-pages')
export class ContentPagesController {
  constructor(private readonly contentPagesService: ContentPagesService) {}

  @ApiOperation({ summary: 'Get all content pages' })
  @Get()
  getAllPages() {
    return this.contentPagesService.getAllPages();
  }

  @ApiOperation({ summary: 'Get CMS content page by type (Public)' })
  @ApiParam({ name: 'type', enum: ContentPageType })
  @Get(':type')
  getPage(@Param('type') type: ContentPageType) {
    return this.contentPagesService.getPage(type);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update CMS content page HTML (Admin only)' })
  @ApiParam({ name: 'type', enum: ContentPageType })
  @Put(':type')
  updatePage(
    @Param('type') type: ContentPageType,
    @Body() dto: UpdateContentPageDto,
  ) {
    return this.contentPagesService.updatePage(type, dto);
  }
}
