import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

/**
 * ------------------------------------------------------------------------
 * Address Entity
 * ------------------------------------------------------------------------
 *
 * Shipping / delivery address belonging to a User.
 *
 * A user may own many addresses.
 * Orders may reference one of these addresses later.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'addresses',
})
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Owner of this address.
   */
  @ManyToOne(() => User, (user) => user.addresses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  /**
   * Short label, e.g. "Home", "Office".
   */
  @Column({
    length: 100,
  })
  title: string;

  @Column({
    length: 100,
  })
  province: string;

  @Column({
    length: 100,
  })
  city: string;

  @Column({
    type: 'text',
  })
  street: string;

  @Column({
    name: 'postal_code',
    length: 20,
  })
  postalCode: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
