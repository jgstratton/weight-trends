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
		date: string;
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	const BUCKET_SIZE = 0.5;

	function buildChart() {
		if (chart) { chart.destroy(); chart = null; }

		const vals = entries.map((e) => parseFloat(e.value)).filter((v) => !isNaN(v));
		if (vals.length === 0) return;

		const minVal = Math.floor(Math.min(...vals) / BUCKET_SIZE) * BUCKET_SIZE;
		const maxVal = Math.ceil(Math.max(...vals) / BUCKET_SIZE) * BUCKET_SIZE;

		const buckets = new Map<string, number>();
		for (let v = minVal; v <= maxVal; v = Math.round((v + BUCKET_SIZE) * 100) / 100) {
			buckets.set(v.toFixed(1), 0);
		}

		for (const v of vals) {
			const bucket = (Math.floor(v / BUCKET_SIZE) * BUCKET_SIZE).toFixed(1);
			buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
		}

		const labels = [...buckets.keys()];
		const counts = [...buckets.values()];

		// Highlight the most common bucket
		const maxCount = Math.max(...counts);
		const bgColors = counts.map((c) =>
			c === maxCount ? 'rgba(99, 102, 241, 0.85)' : 'rgba(99, 102, 241, 0.45)'
		);

		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels: labels.map((l) => `${l}–${(parseFloat(l) + BUCKET_SIZE).toFixed(1)}`),
				datasets: [
					{
						label: 'Days at weight',
						data: counts,
						backgroundColor: bgColors,
						borderColor: bgColors.map((c) => c.replace('0.85', '1').replace('0.45', '0.7')),
						borderWidth: 1,
						borderRadius: 3,
						categoryPercentage: 1.0,
						barPercentage: 0.95
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				scales: {
					x: {
						title: { display: true, text: 'Weight range (lbs)' },
						grid: { display: false }
					},
					y: {
						title: { display: true, text: 'Number of entries' },
						ticks: { stepSize: 1 }
					}
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								const n = ctx.parsed.y;
								return `${n} entr${n === 1 ? 'y' : 'ies'}`;
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
	<p>Add some entries to see your weight distribution.</p>
{:else}
	<div class="chart-wrapper">
		<canvas bind:this={canvas}></canvas>
	</div>
{/if}

<style>
	.chart-wrapper { position: relative; width: 100%; max-height: 400px; }
</style>
