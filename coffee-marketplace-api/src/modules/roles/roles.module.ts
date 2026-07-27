import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesRepository } from './repositories/roles.repository';
import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';

/**
 * Registers all dependencies related to the Roles feature.
 *
 * The repository is registered first so it can be injected
 * into services as the module grows.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Role])],

  controllers: [RolesController],

  providers: [RolesRepository, RolesService],

  exports: [RolesRepository, RolesService],
})
export class RolesModule {}
