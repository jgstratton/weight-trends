import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db/index.js';
import { weights } from '$lib/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { calculateAllTrends } from '$lib/trendUtils.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	const rows = await db
		.select({ value: weights.value, date: weights.date })
		.from(weights)
		.where(eq(weights.userId, locals.user.id))
		.orderBy(asc(weights.date), asc(weights.createdAt));

	const entries = rows.map((r) => ({ value: r.value, date: r.date }));
	const trends = calculateAllTrends(entries);

	// Also compute latest weight and starting weight for context
	const latestWeight = entries.length > 0 ? parseFloat(entries[entries.length - 1].value) : null;
	const totalEntries = entries.length;

	return {
		trends,
		latestWeight,
		totalEntries
	};
};
