<script lang="ts">
	import "../app.css";
	import { injectAnalytics } from "@vercel/analytics/sveltekit";
	import { onMount } from "svelte";

	injectAnalytics();
	let { children } = $props();

	let isDarkMode = $state(false);

	onMount(() => {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			isDarkMode = savedTheme === "dark";
		} else {
			isDarkMode = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
		}
		updateTheme();
	});

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		localStorage.setItem("theme", isDarkMode ? "dark" : "light");
		updateTheme();
	}

	function updateTheme() {
		if (isDarkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}
</script>

<div
	class="app-shell flex flex-col h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F8FAFC] overflow-hidden"
>
	<header
		class="w-full bg-white dark:bg-[#1E293B] border-b border-[#CBD5E1] dark:border-[#334155] px-8 py-4 z-[1000] shrink-0"
	>
		<div
			class="max-w-7xl mx-auto flex items-center justify-between uppercase"
		>
			<div class="flex items-center gap-8">
				<h1 class="text-[14px] font-bold tracking-[0.05em]">ARLTR</h1>
				<div class="h-4 w-px bg-[#E2E8F0] dark:bg-[#334155]"></div>
				<span
					class="text-[11px] font-semibold text-[#64748B] dark:text-[#CBD5E1] tracking-[0.1em]"
					>All Roads Lead To Rome</span
				>
			</div>

			<button
				onclick={toggleTheme}
				class="p-2 rounded-[6px] bg-[#F1F5F9] dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] text-[#1E293B] dark:text-[#F8FAFC] hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] transition-colors flex items-center justify-center"
				aria-label="Toggle theme"
			>
				{#if isDarkMode}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-6.364 1.591-1.591M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-4"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</header>

	<main class="flex-1 p-6 sm:p-8 lg:p-12 overflow-hidden">
		<div
			class="h-full w-full bg-white dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden relative"
		>
			{@render children()}
		</div>
	</main>
</div>

<style>
	:global(body) {
		font-family:
			"Inter",
			system-ui,
			-apple-system,
			sans-serif;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		overflow: hidden;
	}
</style>
