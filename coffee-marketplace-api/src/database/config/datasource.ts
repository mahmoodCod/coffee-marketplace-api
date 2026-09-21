import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

/**
 * Load local `.env` when present.
 * In Docker / CI, variables are injected by the runtime and take precedence.
 */
loadEnv();

/**
 * Detect whether we are running compiled JavaScript (Docker / production)
 * or TypeScript source via ts-node (local migration commands).
 */
const isCompiled = __filename.endsWith('.js');

export default new DataSource({
  type: 'postgres',

  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  synchronize: false,
  logging: process.env.NODE_ENV === 'development',

  entities: [
    isCompiled
      ? 'dist/modules/**/*.entity.js'
      : 'src/modules/**/*.entity.ts',
  ],

  migrations: [
    isCompiled
      ? 'dist/database/migrations/*.js'
      : 'src/database/migrations/*.ts',
  ],
});
