<script lang="ts">
	import { enhance } from '$app/forms';
	import WeightChart from '$lib/components/WeightChart.svelte';

	let { data, form } = $props();

	// Today's date in YYYY-MM-DD local time
	const today = new Date().toLocaleDateString('en-CA');

	// Track which row is being edited (by id), null = none
	let editingId = $state<string | null>(null);
</script>

<h1>Weight Trends</h1>

<!-- Chart -->
<section>
	<WeightChart entries={data.weights} />
</section>

<!-- Add entry form -->
<section>
	<h2>Log weight</h2>
	<form method="POST" action="?/add" use:enhance>
		<label>
			Weight (kg)
			<input name="value" type="number" step="0.1" min="1" max="700" required />
		</label>
		<label>
			Date
			<input name="date" type="date" value={today} max={today} required />
		</label>
		<label>
			Notes
			<input name="notes" type="text" placeholder="Optional" />
		</label>
		<button type="submit">Add</button>
	</form>
	{#if form?.action === 'add' && form?.message}
		<p>{form.message}</p>
	{/if}
</section>

<!-- Weight history -->
<section>
	<h2>History</h2>
	{#if data.weights.length === 0}
		<p>No entries yet. Log your first weight above.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Date</th>
					<th>Weight (kg)</th>
					<th>Notes</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.weights as row (row.id)}
					{#if editingId === row.id}
						<!-- Inline edit row -->
						<tr>
							<td colspan="4">
								<form method="POST" action="?/update" use:enhance={() => async ({ update }) => { await update(); editingId = null; }}>
									<input type="hidden" name="id" value={row.id} />
									<input name="date" type="date" value={row.date} max={today} required />
									<input name="value" type="number" step="0.1" min="1" max="700" value={row.value} required />
									<input name="notes" type="text" value={row.notes} placeholder="Notes" />
									<button type="submit">Save</button>
									<button type="button" onclick={() => (editingId = null)}>Cancel</button>
								</form>
								{#if form?.action === 'update' && form?.message}
									<p>{form.message}</p>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td>{row.date}</td>
							<td>{row.value}</td>
							<td>{row.notes}</td>
							<td>
								<button type="button" onclick={() => (editingId = row.id)}>Edit</button>
								<form method="POST" action="?/delete" use:enhance style="display:inline">
									<input type="hidden" name="id" value={row.id} />
									<button type="submit" onclick={(e) => { if (!confirm('Delete this entry?')) e.preventDefault(); }}>
										Delete
									</button>
								</form>
							</td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</section>
