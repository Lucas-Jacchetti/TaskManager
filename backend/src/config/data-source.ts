import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

export default new DataSource({
  ...buildTypeOrmOptions(process.env.DATABASE_URL as string),
  migrations: ['src/migrations/*.ts'],
});