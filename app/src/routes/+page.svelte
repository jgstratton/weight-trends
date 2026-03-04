<script lang="ts">
	import { browser } from '$app/environment';
	import WeightChart from '$lib/components/WeightChart.svelte';
	import AvgWeightChangeChart from '$lib/components/AvgWeightChangeChart.svelte';
	import WeeklyRangeChart from '$lib/components/WeeklyRangeChart.svelte';
	import CumulativeProgressChart from '$lib/components/CumulativeProgressChart.svelte';
	import VelocityChart from '$lib/components/VelocityChart.svelte';
	import DayOfWeekChart from '$lib/components/DayOfWeekChart.svelte';
	import HistogramChart from '$lib/components/HistogramChart.svelte';
	import YearOverYearChart from '$lib/components/YearOverYearChart.svelte';

	let { data } = $props();

	const STORAGE_KEY = 'chart-prefs';

	type ChartType = 'history' | 'avg-change' | 'weekly-range' | 'cumulative' | 'velocity' | 'day-of-week' | 'histogram' | 'year-over-year';

	function loadPrefs(): { start: string; end: string; chartType: ChartType } {
		if (!browser) return { start: '', end: '', chartType: 'history' };
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) return { start: '', end: '', chartType: 'history', ...JSON.parse(saved) };
		} catch {}
		return { start: '', end: '', chartType: 'history' };
	}

	const prefs = loadPrefs();
	let chartType = $state<ChartType>(prefs.chartType);
	let startDate = $state(prefs.start);
	let endDate = $state(prefs.end);

	// Persist to localStorage whenever any pref changes
	$effect(() => {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ start: startDate, end: endDate, chartType }));
		}
	});

	// Filtered entries derived from the full dataset
	const filteredEntries = $derived(
		data.chartWeights.filter((e) => {
			if (startDate && e.date < startDate) return false;
			if (endDate && e.date > endDate) return false;
			return true;
		})
	);

	function clearDates() {
		startDate = '';
		endDate = '';
	}

	// Min/max from data for clamping the date inputs
	const dataMin = $derived(data.chartWeights[0]?.date ?? '');
	const dataMax = $derived(data.chartWeights[data.chartWeights.length - 1]?.date ?? '');

	const chartOptions: { value: ChartType; label: string }[] = [
		{ value: 'history', label: 'Weight History' },
		{ value: 'avg-change', label: 'Avg Weight Change' },
		{ value: 'weekly-range', label: 'Weekly Range' },
		{ value: 'cumulative', label: 'Cumulative Progress' },
		{ value: 'velocity', label: 'Rate of Change' },
		{ value: 'day-of-week', label: 'Day of Week' },
		{ value: 'histogram', label: 'Distribution' },
		{ value: 'year-over-year', label: 'Year over Year' }
	];
</script>

<main>
	<div class="card">
		<div class="chart-header">
			<div class="chart-title-row">
				<h1 style="margin-bottom:0">Weight Trends</h1>
				<select class="chart-type-select" bind:value={chartType}>
					{#each chartOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<div class="date-range-controls">
				<label class="date-range-label">
					From
					<input
						type="date"
						bind:value={startDate}
						max={endDate || dataMax || undefined}
						min={dataMin || undefined}
					/>
				</label>
				<label class="date-range-label">
					To
					<input
						type="date"
						bind:value={endDate}
						min={startDate || dataMin || undefined}
						max={dataMax || undefined}
					/>
				</label>
				{#if startDate || endDate}
					<button type="button" class="btn-clear-dates" onclick={clearDates}>Clear</button>
				{/if}
			</div>
		</div>
		{#if (startDate || endDate) && filteredEntries.length === 0}
			<p class="alert alert-info" style="margin-top:0.75rem">No entries in the selected date range.</p>
		{/if}
		{#if chartType === 'history'}
			<WeightChart entries={filteredEntries} />
		{:else if chartType === 'avg-change'}
			<AvgWeightChangeChart entries={filteredEntries} />
		{:else if chartType === 'weekly-range'}
			<WeeklyRangeChart entries={filteredEntries} />
		{:else if chartType === 'cumulative'}
			<CumulativeProgressChart entries={filteredEntries} />
		{:else if chartType === 'velocity'}
			<VelocityChart entries={filteredEntries} />
		{:else if chartType === 'day-of-week'}
			<DayOfWeekChart entries={filteredEntries} />
		{:else if chartType === 'histogram'}
			<HistogramChart entries={filteredEntries} />
		{:else if chartType === 'year-over-year'}
			<YearOverYearChart entries={data.chartWeights} />
		{/if}
	</div>
</main>
