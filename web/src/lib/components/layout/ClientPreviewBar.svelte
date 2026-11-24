<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Eye from '@lucide/svelte/icons/eye';

	let { clientId, name }: { clientId: string; name: string | null } = $props();
</script>

<!-- Fixed height: the coach conversation fills the rest of the screen and subtracts this bar. -->
<aside
	class="flex h-11 items-center justify-between gap-3 bg-[#59d9e8] px-4 font-arial text-[0.875rem] text-[#182a30]"
	aria-label="Client preview"
>
	<span class="inline-flex min-w-0 items-center gap-2"
		><Eye size={16} class="shrink-0" aria-hidden="true" /><span class="truncate"
			>Viewing as <strong>{name ?? 'this client'}</strong>. Read only: nothing is saved or sent.</span
		></span
	>
	<a
		class="inline-flex shrink-0 items-center gap-1 font-semibold underline"
		href="/admin/clients/{clientId}"><ArrowLeft size={16} aria-hidden="true" />Back to client</a
	>
</aside>
