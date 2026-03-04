import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db/index.js';
import { weights } from '$lib/db/schema.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/login');
  return {};
};

export const actions: Actions = {
  importCsv: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login');

    const data = await request.formData();
    const file = data.get('csv') as File | null;

    if (!file || file.size === 0) {
      return fail(400, { message: 'Please select a CSV file.' });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length === 0) {
      return fail(400, { message: 'The CSV file is empty.' });
    }

    // Skip header row if present
    const firstLineLower = lines[0].toLowerCase().replace(/"/g, '');
    const startIndex =
      firstLineLower.includes('date') || firstLineLower.includes('weight') ? 1 : 0;

    /** Parse a date string into YYYY-MM-DD or return null */
    function parseDate(raw: string): string | null {
      const s = raw.trim().replace(/^"|"$/g, '');
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // MM/DD/YYYY or M/D/YYYY
      const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (mdyMatch) {
        const [, m, d, y] = mdyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      // DD-MM-YYYY
      const dmyMatch = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      // Fallback: try Date constructor
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
      return null;
    }

    const rows: { userId: string; value: string; date: string }[] = [];
    let skipped = 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 2) { skipped++; continue; }

      const date = parseDate(parts[0]);
      const value = parseFloat(parts[1]);

      if (!date || isNaN(value) || value <= 0 || value > 1000) { skipped++; continue; }

      rows.push({ userId: locals.user.id, value: value.toFixed(2), date });
    }

    if (rows.length === 0) {
      return fail(400, {
        message: `No valid rows found. Ensure the CSV has date and weight columns (date must be YYYY-MM-DD or MM/DD/YYYY).`
      });
    }

    // Insert in batches to avoid hitting parameter limits
    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      await db.insert(weights).values(rows.slice(i, i + BATCH));
    }

    return { imported: rows.length, skipped };
  }
};
