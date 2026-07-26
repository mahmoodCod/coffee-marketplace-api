import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getTypeOrmConfig } from './config/orm.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
