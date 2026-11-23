import { LocalJsonRepository } from './local-store';
import { PostgresRepository } from './postgres';
import type { DatabaseRepository } from './types';

function isPostgresConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (url && !url.includes('MY_') && url.startsWith('postgres')) {
    return true;
  }
  const host = process.env.PGHOST?.trim();
  const db = process.env.PGDATABASE?.trim();
  if (host && db) {
    return true;
  }
  return false;
}

let cachedRepo: DatabaseRepository | null = null;

export function getDb(): DatabaseRepository {
  if (!cachedRepo) {
    cachedRepo = isPostgresConfigured()
      ? new PostgresRepository()
      : new LocalJsonRepository();
  }
  return cachedRepo;
}
