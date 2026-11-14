import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

/**
 * ------------------------------------------------------------------------
 * Guest Identity ORM Entity
 * ------------------------------------------------------------------------
 *
 * Stores anonymous visitor authentication identities.
 *
 * Security:
 * - Only the SHA-256 token hash is stored.
 * - Raw guest authentication tokens must never be persisted.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'support_chat_guest_identities',
})
@Index('IDX_support_chat_guest_identities_expires_at', ['expiresAt'])
export class GuestIdentityOrmEntity {
  /**
   * Internal guest identity identifier.
   */
  @PrimaryColumn({
    type: 'uuid',
  })
  id: string;

  /**
   * SHA-256 hash of the guest authentication token.
   */
  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 64,
    unique: true,
  })
  tokenHash: string;

  /**
   * Guest identity creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  /**
   * Guest identity expiration timestamp.
   */
  @Column({
    name: 'expires_at',
    type: 'timestamptz',
  })
  expiresAt: Date;
}
