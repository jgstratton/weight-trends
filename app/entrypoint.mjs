/**
 * Docker entrypoint: runs Drizzle migrations then starts the SvelteKit server.
 * Plain ESM — no build step needed, runs directly with node.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('ERROR: DATABASE_URL is not set');
	process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, 'drizzle');

const client = postgres(url, { max: 1 });
const db = drizzle(client);

console.log('Running database migrations…');
await migrate(db, { migrationsFolder });
await client.end();
console.log('Migrations complete. Starting app…');

const app = spawn('node', ['build'], { stdio: 'inherit', cwd: __dirname });
app.on('exit', (code) => process.exit(code ?? 0));
