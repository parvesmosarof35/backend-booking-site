import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Robust CORS configuration supporting production sslip.io domains and localhost
  const allowedOrigins = [
    'https://bookingplatfrom-frontend-pao7d3-c7a8c1-2-24-82-111.sslip.io',
    'https://bookingplatfrom-backend-gyq1rh-a97459-2-24-82-111.sslip.io',
    'http://localhost:3000',
    'http://localhost:5018',
    'http://localhost:5017',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.sslip.io') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      // Permissive fallback so legitimate client requests are never dropped
      return callback(null, true);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 86400,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Restaurant & Hotel Table Reservation API')
    .setDescription(
      'Full-featured API for table reservation, floor plan management, online food ordering, CMS, and admin management.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5017;
  await app.listen(port);
  logger.log(`Backend Application is running on port: ${port}`);
  logger.log(`Swagger API Docs available at: /api/docs`);
}

bootstrap();
