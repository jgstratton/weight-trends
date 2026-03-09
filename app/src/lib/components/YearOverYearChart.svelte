<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Tooltip,
		Legend,
		type ChartConfiguration
	} from 'chart.js';

	Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

	interface WeightEntry {
		date: string;
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// Distinct palette for up to ~8 years
	const PALETTE = [
		'rgba(99, 102, 241, 0.9)',
		'rgba(239, 68, 68, 0.9)',
		'rgba(34, 197, 94, 0.9)',
		'rgba(251, 146, 60, 0.9)',
		'rgba(14, 165, 233, 0.9)',
		'rgba(168, 85, 247, 0.9)',
		'rgba(234, 179, 8, 0.9)',
		'rgba(20, 184, 166, 0.9)'
	];

	function buildChart() {
		if (chart) { chart.destroy(); chart = null; }

		// Group by year → month → values
		const yearMap = new Map<number, Map<number, number[]>>();
		for (const e of entries) {
			const val = parseFloat(e.value);
			if (isNaN(val)) continue;
			const [y, m] = e.date.split('-').map(Number);
			if (!yearMap.has(y)) yearMap.set(y, new Map());
			const mMap = yearMap.get(y)!;
			if (!mMap.has(m)) mMap.set(m, []);
			mMap.get(m)!.push(val);
		}

		const years = [...yearMap.keys()].sort();
		if (years.length === 0) return;

		const datasets = years.map((year, idx) => {
			const mMap = yearMap.get(year)!;
			// Build sparse array of 12 month averages (null where no data)
			const monthData: (number | null)[] = MONTH_LABELS.map((_, mi) => {
				const vals = mMap.get(mi + 1);
				if (!vals || vals.length === 0) return null;
				return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
			});

			const color = PALETTE[idx % PALETTE.length];
			return {
				label: String(year),
				data: monthData,
				borderColor: color,
				backgroundColor: 'transparent',
				pointRadius: 4,
				pointHoverRadius: 6,
				borderWidth: 2.5,
				tension: 0.3,
				spanGaps: true
			};
		});

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels: MONTH_LABELS,
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: { padding: { left: 0, right: 0 } },
				interaction: { mode: 'index', intersect: false },
				scales: {
					x: { grid: { display: false } },
					y: {
						title: { display: false },
						grace: '5%'
					}
				},
				plugins: {
					legend: { position: 'top' },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const v = ctx.parsed.y;
								if (v === null) return '';
								return `${ctx.dataset.label}: ${v}`;
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
	$effect(() => { entries; if (canvas) buildChart(); });
</script>

{#if entries.length === 0}
	<p>Add some entries to see the year-over-year comparison.</p>
{:else}
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
{/if}

<style>
	.chart-wrapper {
		position: relative;
		width: 100%;
		height: 400px;
	}

	@media (max-width: 480px) {
		.chart-wrapper {
			height: 300px;
			margin-left: -0.75rem;
			margin-right: -0.75rem;
			width: calc(100% + 1.5rem);
		}
	}
</style>
