import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueActiveCartPerUserIndex1787001000000
  implements MigrationInterface
{
  name = 'AddUniqueActiveCartPerUserIndex1787001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_carts_one_active_per_user" ON "carts" ("user_id") WHERE "status" = 'ACTIVE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."UQ_carts_one_active_per_user"`,
    );
  }
}
