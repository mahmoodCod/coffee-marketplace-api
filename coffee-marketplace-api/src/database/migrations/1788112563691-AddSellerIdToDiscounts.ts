import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerIdToDiscounts1788112563691 implements MigrationInterface {
  name = 'AddSellerIdToDiscounts1788112563691';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add seller_id as nullable first because existing discounts
    // already exist in the database.
    await queryRunner.query(`
      ALTER TABLE "discounts"
      ADD COLUMN "seller_id" uuid
    `);

    // Backfill seller_id from the product that owns the discount.
    await queryRunner.query(`
      UPDATE "discounts" d
      SET "seller_id" = p."seller_id"
      FROM "product_discounts" pd
      INNER JOIN "products" p
        ON p."id" = pd."product_id"
      WHERE pd."discount_id" = d."id"
        AND d."seller_id" IS NULL
    `);

    // Make sure every existing discount now has a seller.
    const result = await queryRunner.query(`
      SELECT COUNT(*)::int AS "count"
      FROM "discounts"
      WHERE "seller_id" IS NULL
    `);

    if (result[0].count > 0) {
      throw new Error(
        'Cannot add NOT NULL seller_id because some existing discounts have no seller.',
      );
    }

    // Make seller_id mandatory.
    await queryRunner.query(`
      ALTER TABLE "discounts"
      ALTER COLUMN "seller_id" SET NOT NULL
    `);

    // Add foreign key.
    await queryRunner.query(`
      ALTER TABLE "discounts"
      ADD CONSTRAINT "FK_discounts_seller_id"
      FOREIGN KEY ("seller_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Add index for seller-based queries.
    await queryRunner.query(`
      CREATE INDEX "IDX_discounts_seller_id"
      ON "discounts" ("seller_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_discounts_seller_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "discounts"
      DROP CONSTRAINT "FK_discounts_seller_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "discounts"
      DROP COLUMN "seller_id"
    `);
  }
}
