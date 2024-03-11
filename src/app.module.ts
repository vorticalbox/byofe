import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import appConfig from './app.config';
import databaseConfig from './database.config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthCheckModule } from './health-check/health-check.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService) => {
        return {
          uri: configService.get('database.uri'),
          maxPoolSize: configService.get('database.maxPoolSize'),
          appName: configService.get('app.name'),
        };
      },
      inject: [ConfigService],
    }),
    HealthCheckModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
