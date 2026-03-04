import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db/index.js';
import { weights } from '$lib/db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/login');

  const rows = await db
    .select()
    .from(weights)
    .where(eq(weights.userId, locals.user.id))
    .orderBy(desc(weights.date), desc(weights.createdAt));

  return {
    weights: rows.map((r) => ({
      id: r.id,
      value: r.value,
      date: r.date,
      notes: r.notes ?? ''
    }))
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
