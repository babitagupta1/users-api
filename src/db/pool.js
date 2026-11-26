
import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

export function createPool(connectionString = config.databaseUrl) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }

  return new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });
}
