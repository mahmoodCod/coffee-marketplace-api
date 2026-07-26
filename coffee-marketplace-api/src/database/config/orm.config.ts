import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',

  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),

  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),

  database: configService.get<string>('database.name'),

  autoLoadEntities: true,

  synchronize: false,

  logging: true,

  entities: ['dist/**/*.entity.ts'],

  migrations: ['dist/database/migrations/*.ts'],
});
