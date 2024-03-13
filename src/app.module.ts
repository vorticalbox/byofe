import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MongooseModule } from '@nestjs/mongoose';
import appConfig from './app.config';
import databaseConfig from './database.config';
import { HealthCheckModule } from './health-check/health-check.module';
import { UserModule } from './user/user.module';
import { RegisterModule } from './register/register.module';
import { LoginModule } from './login/login.module';
import { SessionModule } from './session/session.module';
import { EventModule } from './event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService) => ({
        uri: configService.get('database.uri'),
        maxPoolSize: configService.get('database.maxPoolSize'),
        appName: configService.get('app.name'),
      }),
      inject: [ConfigService],
    }),
    HealthCheckModule,
    UserModule,
    RegisterModule,
    LoginModule,
    SessionModule,
    EventModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
