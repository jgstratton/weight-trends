import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema.js';

// Module-level singleton — reused across requests in the same Node process.
const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, { schema });
