import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds users.name for profile display and creates addresses table.
 */
export class AddUserNameAndAddressesTable1785300000000
  implements MigrationInterface
{
  name = 'AddUserNameAndAddressesTable1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying(100)`,
    );

    await queryRunner.query(
      `CREATE TABLE "addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(100) NOT NULL,
        "province" character varying(100) NOT NULL,
        "city" character varying(100) NOT NULL,
        "street" text NOT NULL,
        "postal_code" character varying(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_addresses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_addresses_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_addresses_user_id" ON "addresses" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_addresses_user_id"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
