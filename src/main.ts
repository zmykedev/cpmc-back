import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    snapshot: true,
  });
  app.setGlobalPrefix('api/v1');

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);

  const enableCors = configService.get<boolean>('CORS');
  const port = configService.get<number>('PORT');

  const gcsKeyFile = configService.get<string>('GCS_KEY_FILE');
  const gcsProjectId = configService.get<string>('GCS_PROJECT_ID');
  const gcsBucketName = configService.get<string>('GCS_BUCKET_NAME');

  console.log('GCS_KEY_FILE', gcsKeyFile);

  console.log('GCS_PROJECT_ID', gcsProjectId);
  console.log('GCS_BUCKET_NAME', gcsBucketName);

  if (enableCors) {
    // OPCIÓN 1: Wildcard sin credentials (más permisivo)
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Bearer',
      ],
      credentials: false, // DEBE ser false con origin: '*'
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  setupSwagger(app);

  console.log('PORT', port);

  await app.listen(Number(port));
}

void bootstrap();
