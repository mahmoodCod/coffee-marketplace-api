import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';

/**
 * Registers all dependencies related to the Roles feature.
 *
 * The repository is registered first so it can be injected
 * into services as the module grows.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role])],
})
export class RolesModule {}
