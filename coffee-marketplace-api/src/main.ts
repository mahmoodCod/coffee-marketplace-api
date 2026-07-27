import { NestFactory } from '@nestjs/core';

import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Global Validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  /**
   * ResponseInterceptor
   */
  app.useGlobalInterceptors(new ResponseInterceptor());

  /**
   * Swagger Configuration
   */
  const config = new DocumentBuilder()
    .setTitle('Coffee Marketplace API')
    .setDescription('RESTful API for Coffee Marketplace Platform')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);

  console.log(`🚀 Server running: http://localhost:3000`);

  console.log(`📘 Swagger: http://localhost:3000/api/docs`);
}

bootstrap();
