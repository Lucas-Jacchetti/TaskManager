import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm.config';

const compiled = __filename.endsWith('.js');

export default new DataSource({
  ...buildTypeOrmOptions(process.env.DATABASE_URL as string),
  migrations: [compiled ? 'dist/migrations/*.js' : 'src/migrations/*.ts'],
});