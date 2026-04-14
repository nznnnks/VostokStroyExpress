import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { JsonSerializerInterceptor } from './common/interceptors/json-serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(process.cwd(), 'uploads');

  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }

  app.setGlobalPrefix('api');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads/' });
  // Production deployments often proxy only `/api/*` to the backend. Expose uploads there too.
  app.useStaticAssets(uploadsPath, { prefix: '/api/uploads/' });
  app.enableCors({
    origin: ['http://localhost:4321', 'http://127.0.0.1:4321'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.useGlobalInterceptors(new JsonSerializerInterceptor());

  await app.listen(3000);
}

bootstrap();
