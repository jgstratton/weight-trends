<script lang="ts">
	import { enhance } from '$app/forms';
	import WeightChart from '$lib/components/WeightChart.svelte';

	let { data, form } = $props();

	// Today's date in YYYY-MM-DD local time
	const today = new Date().toLocaleDateString('en-CA');

	// Track which row is being edited (by id), null = none
	let editingId = $state<string | null>(null);

	// Loading states
	let addingEntry = $state(false);
	let updatingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
</script>

<main>
	<!-- Chart -->
	<div class="card">
		<h1>Weight Trends</h1>
		<WeightChart entries={data.weights} />
	</div>

	<!-- Add entry form -->
	<div class="card">
		<h2>Log weight</h2>
		<form
			method="POST"
			action="?/add"
			use:enhance={() => {
				addingEntry = true;
				return async ({ update }) => {
					await update();
					addingEntry = false;
				};
			}}
		>
			<div class="form-grid">
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
				<div style="display:flex; align-items:flex-end;">
					<button type="submit" disabled={addingEntry} style="width:100%">
						{#if addingEntry}<span class="spinner" aria-hidden="true"></span>{/if}
						{addingEntry ? 'Saving…' : 'Add'}
					</button>
				</div>
			</div>
		</form>
		{#if form?.action === 'add' && form?.message}
			<p class="alert alert-error">{form.message}</p>
		{/if}
	</div>

	<!-- Weight history -->
	<div class="card">
		<h2>History</h2>
		{#if data.weights.length === 0}
			<p class="empty-state">No entries yet. Log your first weight above.</p>
		{:else}
			<div class="table-wrap">
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
										<form
											method="POST"
											action="?/update"
											class="inline-edit-form"
											use:enhance={() => {
												updatingId = row.id;
												return async ({ update }) => {
													await update();
													updatingId = null;
													editingId = null;
												};
											}}
										>
											<input type="hidden" name="id" value={row.id} />
											<input name="date" type="date" value={row.date} max={today} required />
											<input name="value" type="number" step="0.1" min="1" max="700" value={row.value} required />
											<input name="notes" type="text" value={row.notes} placeholder="Notes" />
											<button type="submit" class="btn-sm" disabled={updatingId === row.id}>
												{#if updatingId === row.id}<span class="spinner" aria-hidden="true"></span>{/if}
												{updatingId === row.id ? 'Saving…' : 'Save'}
											</button>
											<button
												type="button"
												class="btn-sm"
												onclick={() => (editingId = null)}
												disabled={updatingId === row.id}
											>
												Cancel
											</button>
										</form>
										{#if form?.action === 'update' && form?.message}
											<p class="alert alert-error">{form.message}</p>
										{/if}
									</td>
								</tr>
							{:else}
								<tr>
									<td>{row.date}</td>
									<td>{row.value}</td>
									<td>{row.notes}</td>
									<td>
										<div class="td-actions">
											<button
												type="button"
												class="btn-sm"
												onclick={() => (editingId = row.id)}
												disabled={!!deletingId}
											>
												Edit
											</button>
											<form
												method="POST"
												action="?/delete"
												use:enhance={() => {
													deletingId = row.id;
													return async ({ update }) => {
														await update({ reset: false });
														deletingId = null;
													};
												}}
												style="display:inline"
											>
												<input type="hidden" name="id" value={row.id} />
												<button
													type="submit"
													class="btn-sm btn-danger"
													disabled={deletingId === row.id}
													onclick={(e) => {
														if (!confirm('Delete this entry?')) e.preventDefault();
													}}
												>
													{#if deletingId === row.id}<span class="spinner" aria-hidden="true"></span>{/if}
													{deletingId === row.id ? '…' : 'Delete'}
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</main>
