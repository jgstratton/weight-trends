<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Tooltip,
		Legend,
		type ChartConfiguration,
		type ScriptableContext
	} from 'chart.js';

	Chart.register(BarController, BarElement, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

	interface WeightEntry {
		date: string;
		value: string;
	}

	let { entries }: { entries: WeightEntry[] } = $props();

	let canvas: HTMLCanvasElement = $state()!;
	let chart: Chart | null = null;

	function getISOWeekLabel(dateStr: string): string {
		const d = new Date(dateStr);
		// Shift to Thursday of the ISO week to get the correct year
		const day = d.getDay() || 7;
		d.setDate(d.getDate() + 4 - day);
		const yearStart = new Date(d.getFullYear(), 0, 1);
		const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
		return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
	}

	function median(vals: number[]): number {
		const s = [...vals].sort((a, b) => a - b);
		const mid = Math.floor(s.length / 2);
		return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
	}

	function buildChart() {
		if (chart) { chart.destroy(); chart = null; }

		const weekMap = new Map<string, number[]>();
		for (const e of entries) {
			const val = parseFloat(e.value);
			if (isNaN(val)) continue;
			const wk = getISOWeekLabel(e.date);
			if (!weekMap.has(wk)) weekMap.set(wk, []);
			weekMap.get(wk)!.push(val);
		}

		const weeks = [...weekMap.keys()].sort();
		if (weeks.length === 0) return;

		const labels = weeks;
		const ranges = weeks.map((w) => {
			const v = weekMap.get(w)!;
			return [Math.min(...v), Math.max(...v)] as [number, number];
		});
		const medians = weeks.map((w) => median(weekMap.get(w)!));

		// Y axis bounds with padding
		const allVals = [...entries].map((e) => parseFloat(e.value)).filter((v) => !isNaN(v));
		const yMin = Math.floor(Math.min(...allVals) - 1);
		const yMax = Math.ceil(Math.max(...allVals) + 1);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const config: ChartConfiguration = {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Weekly range (min–max)',
						data: ranges as unknown as number[],
						backgroundColor: 'rgba(99, 102, 241, 0.25)',
						borderColor: 'rgba(99, 102, 241, 0.7)',
						borderWidth: 1,
						borderRadius: 3,
						order: 2
					},
					{
						// Line overlay for median — uses type override via casting
						label: 'Median',
						data: medians,

						type: 'line',
						borderColor: 'rgba(239, 68, 68, 0.9)',
						backgroundColor: 'transparent',
						pointRadius: 2,
						pointHoverRadius: 5,
						borderWidth: 2,
						tension: 0.3,
						order: 1
					}
				]
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
						min: yMin,
						max: yMax
					}
				},
				plugins: {
					legend: { position: 'top' },
					tooltip: {
						callbacks: {
							label: (ctx) => {
								if (ctx.datasetIndex === 0) {
									const r = ranges[ctx.dataIndex];
								return `Range: ${r[0].toFixed(1)}–${r[1].toFixed(1)}`;
							}
							return `Median: ${(ctx.parsed.y as number).toFixed(1)}`;
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
	<p>Add some entries to see your weekly range chart.</p>
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
