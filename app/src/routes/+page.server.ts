import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db/index.js';
import { weights } from '$lib/db/schema.js';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/login');

  const rows = await db
    .select({ id: weights.id, value: weights.value, date: weights.date, notes: weights.notes })
    .from(weights)
    .where(eq(weights.userId, locals.user.id))
    .orderBy(asc(weights.date), asc(weights.createdAt));

  return {
    chartWeights: rows.map((r) => ({
      id: r.id,
      value: r.value,
      date: r.date,
      notes: r.notes ?? ''
    }))
  };
};
