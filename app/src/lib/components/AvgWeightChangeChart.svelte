<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		LinearScale,
		CategoryScale,
		Tooltip,
		Legend,
		type ChartConfiguration
	} from 'chart.js';

	Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

	interface WeightEntry {
		date: string; // YYYY-MM-DD
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	function buildChart() {
		if (chart) {
			chart.destroy();
			chart = null;
		}

		// Group by YYYY-MM and compute monthly averages
		const monthMap = new Map<string, number[]>();
		for (const e of entries) {
			const month = e.date.slice(0, 7); // YYYY-MM
			const val = parseFloat(e.value);
			if (!isNaN(val)) {
				if (!monthMap.has(month)) monthMap.set(month, []);
				monthMap.get(month)!.push(val);
			}
		}

		// Sort months ascending
		const months = [...monthMap.keys()].sort();
		if (months.length < 2) return;

		const monthlyAvgs = months.map((m) => {
			const vals = monthMap.get(m)!;
			return vals.reduce((s, v) => s + v, 0) / vals.length;
		});

		// Compute month-over-month changes (skip first month — no previous)
		const labels: string[] = [];
		const changes: number[] = [];
		for (let i = 1; i < months.length; i++) {
			const change = Math.round((monthlyAvgs[i] - monthlyAvgs[i - 1]) * 100) / 100;
			// Label as "MMM YYYY"
			const [year, month] = months[i].split('-');
			const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
				month: 'short',
				year: 'numeric'
			});
			labels.push(label);
			changes.push(change);
		}

		const colors = changes.map((c) =>
			c < 0 ? 'rgba(22, 163, 74, 0.75)' : c > 0 ? 'rgba(220, 38, 38, 0.75)' : 'rgba(148, 163, 184, 0.6)'
		);
		const borderColors = changes.map((c) =>
			c < 0 ? 'rgba(22, 163, 74, 1)' : c > 0 ? 'rgba(220, 38, 38, 1)' : 'rgba(148, 163, 184, 1)'
		);

		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Avg monthly change (lbs)',
						data: changes,
						backgroundColor: colors,
						borderColor: borderColors,
						borderWidth: 1.5,
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				interaction: { mode: 'index', intersect: false },
				scales: {
					x: {
						grid: { display: false }
					},
					y: {
						title: { display: true, text: 'lbs change' },
						grid: { color: 'rgba(0,0,0,0.06)' }
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const v = ctx.parsed.y ?? 0;
								const sign = v > 0 ? '+' : '';
								return `Change: ${sign}${v} lbs`;
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
		entries;
		if (canvas) buildChart();
	});
</script>

{#if entries.length < 2}
	<p>Not enough data to show monthly changes. Log entries across at least two months.</p>
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
