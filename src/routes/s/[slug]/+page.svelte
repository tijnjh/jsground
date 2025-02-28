<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { PageData } from '../../$types';

	let { data }: { data: PageData } = $props();

	if (browser) {
		localStorage.code = data.code;
		goto('/');
	}
</script>

<svelte:head>
	<title>Shared code</title>
	<meta name="description" content={data.code} />
</svelte:head>
