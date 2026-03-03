/**
 * Standalone migration runner. Executed before the app starts (see Dockerfile).
 * Uses process.env directly — not SvelteKit's env modules.
 *
 * Run with: node --import tsx/esm src/lib/db/migrate.ts
 * Or via the npm script: npm run migrate
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL environment variable is not set');
	process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, '..', '..', '..', 'drizzle');

const client = postgres(url, { max: 1 });
const db = drizzle(client);

console.log('Running database migrations…');
await migrate(db, { migrationsFolder });
await client.end();
console.log('Migrations complete.');
