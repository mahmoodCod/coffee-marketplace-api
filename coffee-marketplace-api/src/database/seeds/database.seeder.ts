import datasource from '../config/datasource';
import { RolesSeeder } from './roles.seed';

/**
 * Main database seeder.
 *
 * Every new seeder should be registered here.
 */
class DatabaseSeeder {
  async run(): Promise<void> {
    await datasource.initialize();

    console.log('🚀 Database connection established.');

    await new RolesSeeder(datasource).run();

    await datasource.destroy();

    console.log('✅ Database seeding completed.');
  }
}

new DatabaseSeeder().run().catch((error) => {
  console.error('❌ Database seeding failed:', error);
  process.exit(1);
});
