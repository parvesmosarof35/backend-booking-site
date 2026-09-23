import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentPagesService } from './content-pages.service';
import { ContentPagesController } from './content-pages.controller';
import { ContentPage, ContentPageSchema } from '../database/schemas/content-page.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentPage.name, schema: ContentPageSchema },
    ]),
  ],
  controllers: [ContentPagesController],
  providers: [ContentPagesService],
  exports: [ContentPagesService],
})
export class ContentPagesModule {}
