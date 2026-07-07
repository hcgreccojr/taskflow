import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
    // Falha alto em vez de cair silenciosamente para localhost:5173 em produção —
    // um deploy real sem CORS_ORIGIN configurada é um erro de configuração, não
    // um caso de uso válido.
    throw new Error('CORS_ORIGIN é obrigatória em produção (NODE_ENV=production).');
  }

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:5173',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('API REST do TaskFlow — gestão de tarefas colaborativo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
