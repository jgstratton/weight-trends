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

	function getWeekLabel(dateStr: string): string {
		const d = new Date(dateStr);
		const day = d.getDay() || 7;
		d.setDate(d.getDate() + 4 - day);
		const yearStart = new Date(d.getFullYear(), 0, 1);
		const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
		// Label as "MMM D"  (Monday of that week)
		const monday = new Date(dateStr);
		monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
		return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function buildChart() {
		if (chart) { chart.destroy(); chart = null; }

		const sorted = [...entries]
			.sort((a, b) => a.date.localeCompare(b.date))
			.map((e) => ({ date: e.date, y: parseFloat(e.value) }))
			.filter((p) => !isNaN(p.y));

		if (sorted.length < 2) return;

		// Group by week, compute weekly average
		const weekMap = new Map<string, { label: string; vals: number[] }>();
		for (const p of sorted) {
			const wk = p.date.slice(0, 8) + '01'; // use year-week key
			const d = new Date(p.date);
			const monday = new Date(d);
			monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
			const key = monday.toISOString().slice(0, 10);
			const label = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			if (!weekMap.has(key)) weekMap.set(key, { label, vals: [] });
			weekMap.get(key)!.vals.push(p.y);
		}

		const weeks = [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b));
		if (weeks.length < 2) return;

		const weeklyAvgs = weeks.map(([, { label, vals }]) => ({
			label,
			avg: vals.reduce((s, v) => s + v, 0) / vals.length
		}));

		const labels: string[] = [];
		const velocities: number[] = [];
		for (let i = 1; i < weeklyAvgs.length; i++) {
			labels.push(weeklyAvgs[i].label);
			velocities.push(Math.round((weeklyAvgs[i].avg - weeklyAvgs[i - 1].avg) * 100) / 100);
		}

		// Zero reference dataset
		const zeros = new Array(labels.length).fill(0);

		const pointColors = velocities.map((v) =>
			v < 0 ? 'rgba(22, 163, 74, 0.8)' : v > 0 ? 'rgba(220, 38, 38, 0.8)' : 'rgba(148,163,184,0.8)'
		);

		const config: ChartConfiguration = {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Weekly change',
						data: velocities,
						borderColor: 'rgba(99, 102, 241, 0.7)',
						backgroundColor: 'rgba(99, 102, 241, 0.08)',
						pointBackgroundColor: pointColors,
						pointBorderColor: pointColors,
						pointRadius: 4,
						pointHoverRadius: 6,
						borderWidth: 2,
						tension: 0.3,
						fill: 'origin',
						order: 1
					},
					{
						label: 'Zero',
						data: zeros,
						borderColor: 'rgba(100,100,100,0.25)',
						backgroundColor: 'transparent',
						pointRadius: 0,
						borderWidth: 1,
						borderDash: [4, 4],
						tension: 0,
						fill: false,
						order: 2
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
						grace: '10%'
					}
				},
				plugins: {
					legend: {
						labels: {
							filter: (item) => item.text !== 'Zero'
						}
					},
					tooltip: {
						filter: (item) => item.datasetIndex === 0,
						callbacks: {
							label: (ctx) => {
								const v = ctx.parsed.y ?? 0;
								const sign = v > 0 ? '+' : '';
								return `Change: ${sign}${v}`;
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

{#if entries.length < 4}
	<p>Add more entries across multiple weeks to see rate of change.</p>
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
