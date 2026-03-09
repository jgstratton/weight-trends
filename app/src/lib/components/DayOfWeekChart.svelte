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
	import '$lib/chartDefaults';

	interface WeightEntry {
		date: string;
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	// Start from Monday
	const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
	const DAY_LABELS = DAY_ORDER.map((d) => DAY_NAMES[d]);

	function buildChart() {
		if (chart) { chart.destroy(); chart = null; }

		// Bucket by day of week
		const dayBuckets: number[][] = Array.from({ length: 7 }, () => []);
		for (const e of entries) {
			const val = parseFloat(e.value);
			if (isNaN(val)) continue;
			const dow = new Date(e.date + 'T12:00:00').getDay(); // noon avoids DST issues
			dayBuckets[dow].push(val);
		}

		// Overall mean for deviation display
		const allVals = entries.map((e) => parseFloat(e.value)).filter((v) => !isNaN(v));
		const overall = allVals.reduce((s, v) => s + v, 0) / (allVals.length || 1);

		const avgs = DAY_ORDER.map((d) => {
			const vals = dayBuckets[d];
			if (vals.length === 0) return null;
			return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100;
		});

		const deviations = avgs.map((a) => (a === null ? null : Math.round((a - overall) * 100) / 100));
		const counts = DAY_ORDER.map((d) => dayBuckets[d].length);

		const barColors = deviations.map((d) => {
			if (d === null) return 'rgba(148,163,184,0.4)';
			return d <= 0 ? 'rgba(22, 163, 74, 0.7)' : 'rgba(220, 38, 38, 0.7)';
		});

		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels: DAY_LABELS,
				datasets: [
					{
						label: 'Deviation from overall avg',
						data: deviations,
						backgroundColor: barColors,
						borderColor: barColors.map((c) => c.replace('0.7', '1').replace('0.4', '0.6')),
						borderWidth: 1.5,
						borderRadius: 4
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				layout: { padding: { left: 0, right: 0 } },
				scales: {
					x: { grid: { display: false } },
					y: {
						title: { display: false },
						grace: '10%'
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							title: (items) => DAY_LABELS[items[0].dataIndex],
							label: (ctx) => {
								const i = ctx.dataIndex;
								const avg = avgs[i];
								const dev = deviations[i];
								const n = counts[i];
								if (avg === null) return 'No data';
								const sign = (dev ?? 0) >= 0 ? '+' : '';
								return [
							`Avg weight: ${avg}`,
							`vs. overall: ${sign}${dev}`,
									`Entries: ${n}`
								];
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
	<p>Add some entries to see the day-of-week pattern.</p>
{:else}
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
	<p style="font-size:0.82rem; color:#94a3b8; margin-top:0.6rem; text-align:center;">
		Bars show how each day's average weight compares to your overall average.
		Green = typically lighter, red = typically heavier.
	</p>
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
