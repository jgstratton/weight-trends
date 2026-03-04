import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db/index.js';
import { weights } from '$lib/db/schema.js';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';

const PAGE_SIZE = 25;
const VALID_SORT = ['date', 'value', 'notes'] as const;
type SortCol = (typeof VALID_SORT)[number];

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) redirect(303, '/login');

  const search = url.searchParams.get('search')?.trim() ?? '';
  const rawSort = url.searchParams.get('sort') ?? '';
  const sortBy: SortCol = (VALID_SORT as readonly string[]).includes(rawSort)
    ? (rawSort as SortCol)
    : 'date';
  const sortDir = url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));

  const userFilter = eq(weights.userId, locals.user.id);
  const searchFilter = search
    ? sql`(
        CAST(${weights.date} AS TEXT)  ILIKE ${'%' + search + '%'} OR
        CAST(${weights.value} AS TEXT) ILIKE ${'%' + search + '%'} OR
        COALESCE(${weights.notes}, '') ILIKE ${'%' + search + '%'}
      )`
    : undefined;

  const whereClause = searchFilter ? and(userFilter, searchFilter) : userFilter;

  const sortColumn =
    sortBy === 'value' ? weights.value
    : sortBy === 'notes' ? weights.notes
    : weights.date;
  const primaryOrder = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const [{ total }] = await db
    .select({ total: count() })
    .from(weights)
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const rows = await db
    .select()
    .from(weights)
    .where(whereClause)
    .orderBy(primaryOrder, desc(weights.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return {
    weights: rows.map((r) => ({
      id: r.id,
      value: r.value,
      date: r.date,
      notes: r.notes ?? ''
    })),
    pagination: { total, page: safePage, pageSize: PAGE_SIZE, totalPages },
    search,
    sortBy,
    sortDir
  };
};

export const actions: Actions = {
  add: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login');

    const data = await request.formData();
    const value = parseFloat(String(data.get('value') ?? ''));
    const date = String(data.get('date') ?? '').trim();
    const notes = String(data.get('notes') ?? '').trim();

    if (isNaN(value) || value <= 0) {
      return fail(400, { action: 'add', message: 'Please enter a valid weight.' });
    }
    if (!date) {
      return fail(400, { action: 'add', message: 'Please select a date.' });
    }

    await db.insert(weights).values({
      userId: locals.user.id,
      value: value.toString(),
      date,
      notes: notes || null
    });
  },

  update: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login');

    const data = await request.formData();
    const id = String(data.get('id') ?? '').trim();
    const value = parseFloat(String(data.get('value') ?? ''));
    const date = String(data.get('date') ?? '').trim();
    const notes = String(data.get('notes') ?? '').trim();

    if (!id || isNaN(value) || value <= 0 || !date) {
      return fail(400, { action: 'update', message: 'Invalid data.' });
    }

    await db
      .update(weights)
      .set({ value: value.toString(), date, notes: notes || null })
      .where(and(eq(weights.id, id), eq(weights.userId, locals.user.id)));
  },

  delete: async ({ request, locals }) => {
    if (!locals.user) redirect(303, '/login');

    const data = await request.formData();
    const id = String(data.get('id') ?? '').trim();

    if (!id) return fail(400, { action: 'delete', message: 'Missing id.' });

    await db
      .delete(weights)
      .where(and(eq(weights.id, id), eq(weights.userId, locals.user.id)));
  }
};
