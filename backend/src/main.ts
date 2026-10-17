import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);


  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  const apiHelmet = helmet();
  const docsHelmet = helmet({ contentSecurityPolicy: false });
  app.use((req: Request, res: Response, next: NextFunction) =>
    (req.path.startsWith('/docs') ? docsHelmet : apiHelmet)(req, res, next),
  );

  app.enableCors({
    origin: config
      .get<string>('FRONTEND_URL', 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim()),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task SaaS API')
    .setDescription('API de tarefas diárias, semanais e customizadas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.get<number>('PORT', 3000));
}
bootstrap();