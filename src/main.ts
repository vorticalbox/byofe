import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

/**
 *
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      whitelist: true,
      transform: true,
      disableErrorMessages:
        configService.get<string>('app.environment') === 'production',
    }),
  );
  const config = new DocumentBuilder()
    .setTitle(configService.get('app.name'))
    .setVersion(process.env.npm_package_version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  await app.listen(configService.get('app.port'));
  logger.log(`Environment: ${configService.get<string>('app.environment')}`);
  const url = `${configService.get<string>(
    'app.protocol',
  )}://${configService.get<string>('app.host')}:${configService.get<number>(
    'app.port',
  )}`;
  logger.log(`Listening at ${url}`);
  logger.log(`Open API: ${url}/docs`);

  logger.log(`Open API (JSON): ${url}/docs-json`);
  logger.log(`Log Level: ${configService.get('app.logLevel')}`);
}
bootstrap();
