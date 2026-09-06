import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArticlesPublishedIndex1788736000000
  implements MigrationInterface
{
  name = 'AddArticlesPublishedIndex1788736000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_articles_is_published_published_at" ON "articles" ("is_published", "published_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_articles_is_published_published_at"`,
    );
  }
}
