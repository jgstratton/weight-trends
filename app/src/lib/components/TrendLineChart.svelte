<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		TimeScale,
		Tooltip,
		Legend,
		type ChartConfiguration
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';
	import type { TrendResult, Projection } from '$lib/trendUtils.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);
	import '$lib/chartDefaults';

	interface WeightEntry {
		date: string;
		value: string;
	}

	interface ProjectionItem {
		label: string;
		projection: Projection;
	}

	let {
		entries,
		trend,
		windowLabel,
		projections,
		targetWeight = null
	}: {
		entries: WeightEntry[];
		trend: TrendResult;
		windowLabel: string;
		projections: ProjectionItem[];
		targetWeight?: number | null;
	} = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	type SeriesKey = 'weight' | 'trend' | 'projections';

	const VISIBILITY_STORAGE_KEY = 'trendLineChart.visibility';
	const DATASET_KEY_BY_INDEX: Record<number, SeriesKey> = {
		0: 'weight',
		1: 'trend',
		2: 'projections'
	};

	let visibleSeries = $state<Record<SeriesKey, boolean>>({
		weight: true,
		trend: true,
		projections: true
	});

	function loadVisibleSeries() {
		try {
			const raw = localStorage.getItem(VISIBILITY_STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Partial<Record<SeriesKey, unknown>>;
			visibleSeries = {
				weight: parsed.weight === false ? false : true,
				trend: parsed.trend === false ? false : true,
				projections: parsed.projections === false ? false : true
			};
		} catch {
			// Ignore malformed storage and keep defaults.
		}
	}

	function persistVisibleSeries() {
		try {
			localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(visibleSeries));
		} catch {
			// Ignore storage failures (e.g. private mode restrictions).
		}
	}

	function syncVisibleSeriesFromChart(currentChart: Chart) {
		for (const [idx, key] of Object.entries(DATASET_KEY_BY_INDEX)) {
			visibleSeries[key] = currentChart.isDatasetVisible(Number(idx)) === true;
		}
		persistVisibleSeries();
	}

	function handleLegendClick(_: unknown, legendItem: { datasetIndex?: number }, legend: { chart: Chart }) {
		const datasetIndex = legendItem.datasetIndex;
		if (datasetIndex === undefined) return;

		const c = legend.chart;
		c.setDatasetVisibility(datasetIndex, !c.isDatasetVisible(datasetIndex));
		c.update();
		syncVisibleSeriesFromChart(c);
	}

	function buildChart() {
		if (chart) {
			syncVisibleSeriesFromChart(chart);
			chart.destroy();
			chart = null;
		}

		// Filter entries to the trend window
		const windowEntries = entries
			.filter((e) => e.date >= trend.startDate && e.date <= trend.endDate)
			.map((e) => ({ x: new Date(e.date).getTime(), y: parseFloat(e.value) }));

		if (windowEntries.length === 0) return;

		const startMs = new Date(trend.startDate).getTime();
		const msToDays = 1 / (86400 * 1000);

		// Projection points as distinct markers
		const projectionPoints = projections.map((p) => ({
			x: new Date(p.projection.date).getTime(),
			y: p.projection.weight,
			label: p.label
		}));

		const minDataMs = Math.min(...windowEntries.map((p) => p.x));
		const maxDataMs = Math.max(...windowEntries.map((p) => p.x));

		// Sample trend line across the historical data range only.
		const trendDays = (maxDataMs - minDataMs) * msToDays;
		const trendSteps = Math.max(2, Math.round(trendDays / 3));

		// Lower bound for descending trends: stop at targetWeight if set, else at 0.
		const stopWeight = targetWeight ?? 0;

		const trendLine = Array.from({ length: trendSteps + 1 }, (_, i) => {
			const ms = minDataMs + (i / trendSteps) * (maxDataMs - minDataMs);
			const dayOffset = (ms - startMs) * msToDays;
			return { x: ms, y: trend.intercept + trend.slopePerDay * dayOffset };
		});

		// Build a dedicated projection line from the end of data to the projection horizon.
		const maxProjectionMs = projectionPoints.length > 0
			? Math.max(...projectionPoints.map((p) => p.x))
			: maxDataMs;
		const projectionDays = (maxProjectionMs - maxDataMs) * msToDays;
		const projectionSteps = Math.max(2, Math.round(projectionDays / 3));

		const rawProjectionLine = Array.from({ length: projectionSteps + 1 }, (_, i) => {
			const ms = maxDataMs + (i / projectionSteps) * (maxProjectionMs - maxDataMs);
			const dayOffset = (ms - startMs) * msToDays;
			return { x: ms, y: trend.intercept + trend.slopePerDay * dayOffset };
		});

		// Stop descending projections when they cross the lower bound.
		const projectionLine: { x: number; y: number }[] = [];
		for (let i = 0; i < rawProjectionLine.length; i++) {
			const pt = rawProjectionLine[i];
			const crossesLowerBound = trend.slopePerDay < 0 && pt.y <= stopWeight;

			if (crossesLowerBound) {
				// Interpolate crossing point
				if (i > 0) {
					const prev = rawProjectionLine[i - 1];
					const t = (stopWeight - prev.y) / (pt.y - prev.y);
					projectionLine.push({ x: prev.x + t * (pt.x - prev.x), y: stopWeight });
				} else {
					projectionLine.push({ x: pt.x, y: stopWeight });
				}
				break;
			}
			projectionLine.push(pt);
		}

		// Vertical line at today (end of real data)
		const endMs = new Date(trend.endDate).getTime();

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				datasets: [
					{
						label: 'Weight',
						data: windowEntries,
							hidden: !visibleSeries.weight,
						borderColor: 'rgba(99, 102, 241, 0.7)',
						backgroundColor: 'rgba(99, 102, 241, 0.08)',
						pointRadius: 2,
						pointHoverRadius: 5,
						borderWidth: 1.5,
						tension: 0,
						fill: false,
						order: 3
					},
					{
							label: 'Trend',
						data: trendLine,
							hidden: !visibleSeries.trend,
						borderColor: 'rgba(251, 191, 36, 0.9)',
						backgroundColor: 'transparent',
						pointRadius: 0,
						borderWidth: 2,
						tension: 0,
						fill: false,
						order: 2
					},
					{
						label: 'Projections',
						data: projectionLine,
							hidden: !visibleSeries.projections,
						borderColor: 'rgba(52, 211, 153, 0.9)',
						backgroundColor: 'transparent',
						pointRadius: 0,
						borderWidth: 2,
						tension: 0,
						fill: false,
						order: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				scales: {
					x: {
						type: 'time',
						time: { unit: 'day', tooltipFormat: 'MMM d, yyyy' },
						grid: { display: false }
					},
					y: {
						grace: '5%'
					}
				},
				plugins: {
					legend: {
						position: 'top',
						onClick: handleLegendClick
					},
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const y = ctx.parsed.y?.toFixed(1) ?? '';
								return `${ctx.dataset.label}: ${y} lbs`;
							}
						}
					}
				}
			}
		};

		chart = new Chart(canvas, config);
	}

	onMount(() => {
		loadVisibleSeries();
		buildChart();
	});
	onDestroy(() => chart?.destroy());

	$effect(() => {
		// Re-build when inputs change
		entries;
		trend;
		projections;
		targetWeight;
		if (canvas) buildChart();
	});
</script>

<div class="chart-wrapper">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-wrapper {
		position: relative;
		width: 100%;
		height: 340px;
	}

	@media (max-width: 480px) {
		.chart-wrapper {
			height: 260px;
			margin-left: -0.75rem;
			margin-right: -0.75rem;
			width: calc(100% + 1.5rem);
		}
	}
</style>
