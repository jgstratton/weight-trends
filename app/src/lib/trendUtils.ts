/**
 * Trend calculation utilities using linear regression (least-squares best-fit line).
 */

export interface WeightEntry {
	date: string; // YYYY-MM-DD
	value: string; // numeric string from DB
}

export interface TrendResult {
	/** Slope in lbs/day */
	slopePerDay: number;
	/** Slope in lbs/week */
	slopePerWeek: number;
	/** Intercept (weight at the start of the window) */
	intercept: number;
	/** Current fitted value (end of window) */
	currentFitted: number;
	/** Start date of the window */
	startDate: string;
	/** End date of the window (latest entry) */
	endDate: string;
	/** Number of data points in the window */
	dataPoints: number;
	/** R-squared goodness of fit */
	rSquared: number;
}

export interface Projection {
	/** Projected weight */
	weight: number;
	/** Target date */
	date: string;
	/** Change from current fitted weight */
	change: number;
}

export interface TrendWithProjections {
	label: string;
	windowDays: number;
	trend: TrendResult | null;
	projections: { label: string; projection: Projection }[];
}

/** Named time windows */
export const TREND_WINDOWS = [
	{ label: '30 Day', days: 30 },
	{ label: '90 Day', days: 90 },
	{ label: '6 Month', days: 183 },
	{ label: '1 Year', days: 365 },
	{ label: '5 Year', days: 1826 }
] as const;

/** Named projection horizons */
export const PROJECTION_HORIZONS = [
	{ label: '30 Days', days: 30 },
	{ label: '90 Days', days: 90 },
	{ label: '6 Months', days: 183 },
	{ label: '1 Year', days: 365 },
	{ label: '5 Years', days: 1826 }
] as const;

/**
 * Perform ordinary least-squares linear regression.
 * x = days since the start of the window
 * y = weight value
 */
function linearRegression(points: { x: number; y: number }[]): {
	slope: number;
	intercept: number;
	rSquared: number;
} {
	const n = points.length;
	if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0, rSquared: 0 };

	let sumX = 0;
	let sumY = 0;
	let sumXY = 0;
	let sumXX = 0;

	for (const p of points) {
		sumX += p.x;
		sumY += p.y;
		sumXY += p.x * p.y;
		sumXX += p.x * p.x;
	}

	const denom = n * sumXX - sumX * sumX;
	if (denom === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

	const slope = (n * sumXY - sumX * sumY) / denom;
	const intercept = (sumY - slope * sumX) / n;

	// R-squared
	const meanY = sumY / n;
	let ssTot = 0;
	let ssRes = 0;
	for (const p of points) {
		const predicted = intercept + slope * p.x;
		ssTot += (p.y - meanY) ** 2;
		ssRes += (p.y - predicted) ** 2;
	}
	const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

	return { slope, intercept, rSquared };
}

/** Parse YYYY-MM-DD to a Date at midnight UTC */
function parseDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d));
}

/** Format a Date as YYYY-MM-DD */
function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

/** Difference in days between two dates */
function daysBetween(a: Date, b: Date): number {
	return Math.round((b.getTime() - a.getTime()) / (86400 * 1000));
}

/**
 * Calculate a trend for a given time window of recent weight data.
 * Data should already be sorted ascending by date.
 */
export function calculateTrend(
	entries: WeightEntry[],
	windowDays: number,
	referenceDate?: Date
): TrendResult | null {
	if (entries.length < 2) return null;

	const refDate = referenceDate ?? parseDate(entries[entries.length - 1].date);
	const windowStart = new Date(refDate.getTime() - windowDays * 86400 * 1000);

	// Filter entries within the window
	const windowEntries = entries.filter((e) => {
		const d = parseDate(e.date);
		return d >= windowStart && d <= refDate;
	});

	if (windowEntries.length < 2) return null;

	const firstDate = parseDate(windowEntries[0].date);
	const points = windowEntries.map((e) => ({
		x: daysBetween(firstDate, parseDate(e.date)),
		y: parseFloat(e.value)
	}));

	const { slope, intercept, rSquared } = linearRegression(points);

	const lastDate = parseDate(windowEntries[windowEntries.length - 1].date);
	const totalDays = daysBetween(firstDate, lastDate);

	return {
		slopePerDay: slope,
		slopePerWeek: slope * 7,
		intercept,
		currentFitted: intercept + slope * totalDays,
		startDate: windowEntries[0].date,
		endDate: windowEntries[windowEntries.length - 1].date,
		dataPoints: windowEntries.length,
		rSquared: Math.max(0, rSquared)
	};
}

/**
 * Project a trend forward by a given number of days.
 */
export function projectTrend(trend: TrendResult, futureDays: number): Projection {
	const projectedWeight = trend.currentFitted + trend.slopePerDay * futureDays;
	const endDate = parseDate(trend.endDate);
	const futureDate = new Date(endDate.getTime() + futureDays * 86400 * 1000);

	return {
		weight: projectedWeight,
		date: formatDate(futureDate),
		change: projectedWeight - trend.currentFitted
	};
}

/**
 * Calculate all trends and projections for the given weight data.
 */
export function calculateAllTrends(entries: WeightEntry[]): TrendWithProjections[] {
	return TREND_WINDOWS.map((window) => {
		const trend = calculateTrend(entries, window.days);
		const projections = trend
			? PROJECTION_HORIZONS.map((horizon) => ({
					label: horizon.label,
					projection: projectTrend(trend, horizon.days)
				}))
			: [];

		return {
			label: window.label,
			windowDays: window.days,
			trend,
			projections
		};
	});
}
