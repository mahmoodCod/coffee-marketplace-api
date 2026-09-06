import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArticleModule1788735433897 implements MigrationInterface {
    name = 'AddArticleModule1788735433897'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "slug" character varying(220) NOT NULL, "excerpt" text, "content" text NOT NULL, "thumbnail" character varying(500), "badge" character varying(50), "read_time" integer, "is_published" boolean NOT NULL DEFAULT false, "published_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "author_id" uuid NOT NULL, CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "article_products" ("article_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "PK_eb8548cc46d08bc4645cdbb74fb" PRIMARY KEY ("article_id", "product_id"))`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_6515da4dff8db423ce4eb841490" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_products" ADD CONSTRAINT "FK_d34cc188ef19dddf06b2153e678" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article_products" ADD CONSTRAINT "FK_64477f7437963a8412fbf7f86d8" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article_products" DROP CONSTRAINT "FK_64477f7437963a8412fbf7f86d8"`);
        await queryRunner.query(`ALTER TABLE "article_products" DROP CONSTRAINT "FK_d34cc188ef19dddf06b2153e678"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_6515da4dff8db423ce4eb841490"`);
        await queryRunner.query(`DROP TABLE "article_products"`);
        await queryRunner.query(`DROP TABLE "articles"`);
    }

}
