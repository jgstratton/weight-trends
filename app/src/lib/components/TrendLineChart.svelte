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
		projections
	}: {
		entries: WeightEntry[];
		trend: TrendResult;
		windowLabel: string;
		projections: ProjectionItem[];
	} = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	function buildChart() {
		if (chart) {
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

		// Extend trend line from start of window all the way to the last projection date
		const allMs = [
			...windowEntries.map((p) => p.x),
			...projectionPoints.map((p) => p.x)
		];
		const minMs = Math.min(...allMs);
		const maxMs = Math.max(...allMs);

		// Sample trend line at regular intervals for a smooth line
		const totalDays = (maxMs - minMs) * msToDays;
		const steps = Math.max(2, Math.round(totalDays / 3));
		const trendLine = Array.from({ length: steps + 1 }, (_, i) => {
			const ms = minMs + (i / steps) * (maxMs - minMs);
			const dayOffset = (ms - startMs) * msToDays;
			return { x: ms, y: trend.intercept + trend.slopePerDay * dayOffset };
		});

		// Vertical line at today (end of real data)
		const endMs = new Date(trend.endDate).getTime();

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				datasets: [
					{
						label: 'Weight',
						data: windowEntries,
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
						label: `${windowLabel} Trend`,
						data: trendLine,
						borderColor: 'rgba(251, 191, 36, 0.9)',
						backgroundColor: 'transparent',
						pointRadius: 0,
						borderWidth: 2,
						borderDash: [
							// solid through historical window, dashed in projection zone
							0
						],
						tension: 0,
						fill: false,
						order: 2
					},
					{
						label: 'Projections',
						data: projectionPoints,
						borderColor: 'rgba(52, 211, 153, 0.9)',
						backgroundColor: 'rgba(52, 211, 153, 0.25)',
						pointRadius: 6,
						pointHoverRadius: 8,
						pointStyle: 'circle',
						borderWidth: 2,
						showLine: false,
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
					legend: { position: 'top' },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const y = ctx.parsed.y?.toFixed(1) ?? '';
								// For projection points, show the horizon label too
								if (ctx.dataset.label === 'Projections') {
									const pt = projectionPoints[ctx.dataIndex];
									return `${pt?.label ?? 'Projection'}: ${y} lbs`;
								}
								return `${ctx.dataset.label}: ${y} lbs`;
							}
						}
					}
				}
			}
		};

		chart = new Chart(canvas, config);
	}

	onMount(() => buildChart());
	onDestroy(() => chart?.destroy());

	$effect(() => {
		// Re-build when inputs change
		entries;
		trend;
		projections;
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
