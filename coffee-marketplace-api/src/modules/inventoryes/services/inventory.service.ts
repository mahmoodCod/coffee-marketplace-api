import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Inventory } from '../entities/inventory.entity';

import { UpdateInventoryDto, InventoryResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Inventory Service
 * ------------------------------------------------------------------------
 *
 * Handles inventory business logic.
 *
 * Responsibilities:
 *
 * - Retrieve inventory
 * - Update stock
 * - Check stock availability
 * - Increase stock
 * - Decrease stock
 * ------------------------------------------------------------------------
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoriesRepository: Repository<Inventory>,
  ) {}
}
