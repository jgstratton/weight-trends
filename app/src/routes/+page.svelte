<script lang="ts">
	import WeightChart from '$lib/components/WeightChart.svelte';

	let { data } = $props();
</script>

<main>
	<div class="card">
		<h1>Weight Trends</h1>
		<WeightChart entries={data.chartWeights} />
	</div>
</main>
