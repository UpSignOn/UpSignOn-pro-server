import { Pool } from 'pg';
import env from './env';
// @ts-ignore
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  database: env.DB_NAME,
  password: env.DB_PASS,
});

const query = (
  text: string,
  params?: Array<any>,
): Promise<{
  rows: any[];
  fields: { name: string }[];
  rowCount: number;
  command: string;
}> => pool.query(text, params);

const gracefulShutdown = (): Promise<void> => pool.end();

export const db = {
  query,
  gracefulShutdown,
};
