<script lang="ts">
	import { resolve } from '$app/paths';
	let { form } = $props();
</script>

<svelte:head><title>Admin sign in | Configains</title></svelte:head>
<main class="grid min-h-screen place-items-center bg-[#172019] px-6">
	<form method="POST" class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
		<a href={resolve('/')} class="text-xl font-black">CONFIGAINS</a>
		<h1 class="mt-8 text-3xl font-black">Content studio</h1>
		<p class="mt-2 text-sm text-slate-500">Sign in with your administrator account.</p>
		{#if form?.message}<p class="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
				{form.message}
			</p>{/if}
		<label class="mt-6 grid gap-1 text-sm font-bold"
			>Email<input
				name="email"
				type="email"
				autocomplete="email"
				required
				value={form?.email ?? ''}
				class="rounded-lg border-slate-300 font-normal"
			/></label
		>
		<label class="mt-4 grid gap-1 text-sm font-bold"
			>Password<input
				name="password"
				type="password"
				autocomplete="current-password"
				required
				class="rounded-lg border-slate-300 font-normal"
			/></label
		>
		<button class="mt-6 w-full rounded-lg bg-emerald-700 px-5 py-3 font-black text-white"
			>Sign in</button
		>
	</form>
</main>
