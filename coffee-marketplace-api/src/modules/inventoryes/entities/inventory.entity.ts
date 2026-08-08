import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

/**
 * ------------------------------------------------------------------------
 * Inventory Entity
 * ------------------------------------------------------------------------
 *
 * Represents stock information of a product.
 *
 * Responsibilities:
 *
 * - Store available stock
 * - Track reserved stock
 * - Provide product availability information
 *
 * Business Rules:
 *
 * - Every product has one inventory.
 * - Stock cannot be negative.
 * - Reserved stock cannot exceed stock.
 * ------------------------------------------------------------------------
 */

@Entity('inventories')
export class Inventory {
  /**
   * Inventory unique identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Related product.
   *
   * Relationship:
   *
   * Product 1 ---- 1 Inventory
   */
  @OneToOne(() => Product, (product) => product.inventory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;

  /**
   * Total stock quantity.
   *
   * Example:
   *
   * 100 bags of coffee available.
   */
  @Column({
    type: 'int',
    default: 0,
  })
  stock: number;

  /**
   * Reserved stock quantity.
   *
   * Used later when order process starts.
   *
   * Example:
   *
   * Customer added 5 items
   * but payment is not completed yet.
   */
  @Column({
    type: 'int',
    default: 0,
  })
  reservedStock: number;

  /**
   * Record creation timestamp.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Record update timestamp.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
