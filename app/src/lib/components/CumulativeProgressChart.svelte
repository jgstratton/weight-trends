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
		type ChartConfiguration,
		type ScriptableContext
	} from 'chart.js';
	import 'chartjs-adapter-date-fns';

	Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);
	import '$lib/chartDefaults';

	interface WeightEntry {
		date: string;
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	function buildChart() {
		if (chart) { chart.destroy(); chart = null; }

		const sorted = [...entries]
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((e) => ({ x: new Date(e.date).getTime(), y: parseFloat(e.value) }))
			.filter((p) => !isNaN(p.y));

		if (sorted.length === 0) return;

		const baseline = sorted[0].y;
		const cumulative = sorted.map((p) => ({
			x: p.x,
			y: Math.round((p.y - baseline) * 100) / 100
		}));

		const colors = cumulative.map((p) =>
			p.y < 0 ? 'rgba(22, 163, 74, 0.6)' : 'rgba(220, 38, 38, 0.6)'
		);

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				datasets: [
					{
						label: 'Cumulative change',
						data: cumulative,
						borderColor: 'rgba(99, 102, 241, 0.85)',
						backgroundColor: (ctx: ScriptableContext<'line'>) => {
							const chart = ctx.chart;
							const { ctx: c, chartArea } = chart;
							if (!chartArea) return 'rgba(99,102,241,0.1)';
							const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
							gradient.addColorStop(0, 'rgba(220,38,38,0.15)');
							gradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
							gradient.addColorStop(1, 'rgba(22,163,74,0.15)');
							return gradient;
						},
						pointRadius: 0,
						pointHoverRadius: 4,
						borderWidth: 2,
						tension: 0.2,
						fill: 'origin'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: { padding: { left: 0, right: 0 } },
				interaction: { mode: 'index', intersect: false },
				scales: {
					x: {
						type: 'time',
						time: { unit: 'day', tooltipFormat: 'MMM d, yyyy' },
						grid: { display: false }
					},
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
							const v = ctx.parsed.y ?? 0;
								const sign = v > 0 ? '+' : '';
								return `Change: ${sign}${v} from start`;
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

{#if entries.length < 2}
	<p>Add at least two entries to see cumulative progress.</p>
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
