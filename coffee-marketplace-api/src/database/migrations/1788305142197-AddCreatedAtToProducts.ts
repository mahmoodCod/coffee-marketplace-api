import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToProducts1788305142197 implements MigrationInterface {
    name = 'AddCreatedAtToProducts1788305142197'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discounts" DROP CONSTRAINT "FK_discounts_seller_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_discounts_seller_id"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_50bafcbca82d8fdcbcf9f751ba" ON "discounts" ("is_active", "end_date") `);
        await queryRunner.query(`ALTER TABLE "discounts" ADD CONSTRAINT "FK_420e453f600abe0e56dee349096" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "discounts" DROP CONSTRAINT "FK_420e453f600abe0e56dee349096"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_50bafcbca82d8fdcbcf9f751ba"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "created_at"`);
        await queryRunner.query(`CREATE INDEX "IDX_discounts_seller_id" ON "discounts" ("seller_id") `);
        await queryRunner.query(`ALTER TABLE "discounts" ADD CONSTRAINT "FK_discounts_seller_id" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
