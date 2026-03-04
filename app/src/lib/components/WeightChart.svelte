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
		Filler,
		type ChartConfiguration
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';

	Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);

	interface WeightEntry {
		date: string; // YYYY-MM-DD
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	function computeSma(
		sorted: { x: number; y: number }[],
		window: number
	): { x: number; y: number }[] {
		return sorted.map((_, i) => {
			const slice = sorted.slice(Math.max(0, i - window + 1), i + 1);
			const avg = slice.reduce((sum, p) => sum + p.y, 0) / slice.length;
			return { x: sorted[i].x, y: Math.round(avg * 10) / 10 };
		});
	}

	function buildChart() {
		if (chart) {
			chart.destroy();
			chart = null;
		}

		// Sort ascending by date for correct SMA calculation
		const sorted = [...entries]
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((e) => ({ x: new Date(e.date).getTime(), y: parseFloat(e.value) }));

		if (sorted.length === 0) return;

		const sma7 = computeSma(sorted, 7);
		const sma30 = computeSma(sorted, 30);

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				datasets: [
					{
						label: 'Weight (lbs)',
						data: sorted,
						borderColor: 'rgba(99, 102, 241, 0.8)',
						backgroundColor: 'rgba(99, 102, 241, 0.1)',
						pointRadius: 0,
						pointHoverRadius: 4,
						borderWidth: 2,
						tension: 0,
						fill: false,
						order: 3
					},
					{
						label: '7-day average',
						data: sma7,
						borderColor: 'rgba(239, 68, 68, 0.9)',
						backgroundColor: 'transparent',
						pointRadius: 0,
						borderWidth: 2.5,
						tension: 0.3,
						fill: false,
						order: 2
					},
					{
						label: '30-day trend',
						data: sma30,
						borderColor: 'rgba(234, 179, 8, 0.9)',
						backgroundColor: 'transparent',
						pointRadius: 0,
						borderWidth: 2.5,
						borderDash: [6, 3],
						tension: 0.3,
						fill: false,
						order: 1
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				interaction: { mode: 'index', intersect: false },
				scales: {
					x: {
						type: 'time',
						time: { unit: 'day', tooltipFormat: 'MMM d, yyyy' },
						grid: { display: false }
					},
					y: {
						title: { display: true, text: 'lbs' },
						grace: '5%'
					}
				},
				plugins: {
					legend: { position: 'top' },
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} lbs`
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
		// Re-build when entries change
		entries;
		if (canvas) buildChart();
	});
</script>

{#if entries.length === 0}
	<p>Add some entries to see your chart.</p>
{:else}
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
{/if}

<style>
	.chart-wrapper {
		position: relative;
		width: 100%;
		max-height: 400px;
	}
</style>
