import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCouponModule1788395787441 implements MigrationInterface {
    name = 'AddCouponModule1788395787441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "type" character varying(50) NOT NULL, "value" numeric(12,2) NOT NULL, "description" text, "minimum_order_amount" numeric(12,2), "maximum_discount_amount" numeric(12,2), "usage_limit" integer, "used_count" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3100e2e05335c25a25eb805b27" ON "coupons" ("is_active", "expires_at") `);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_6284f0f60e4cb96c12ff96f0f15" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_6284f0f60e4cb96c12ff96f0f15"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3100e2e05335c25a25eb805b27"`);
        await queryRunner.query(`DROP TABLE "coupons"`);
    }

}
