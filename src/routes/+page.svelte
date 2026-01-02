<script lang="ts">
    import Map from "$lib/components/Map.svelte";
    import { ROME } from "$lib/config";

    let routeData = $state(null);
    let isLoading = $state(false);
    let error = $state(null);

    async function handleMapClick(start: { lat: number; lng: number }) {
        isLoading = true;
        error = null;
        routeData = null;

        try {
            const response = await fetch("/api/route", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    start,
                    end: { lat: ROME.lat, lng: ROME.lng },
                    profile: "car",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to calculate route");
            }

            if (data.success) {
                routeData = data.route;
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            isLoading = false;
        }
    }

    function clearRoute() {
        routeData = null;
        error = null;
    }
</script>

<div class="h-full w-full relative">
    <Map onMapClick={handleMapClick} {routeData} />

    {#if isLoading}
        <div
            class="absolute inset-0 z-[2000] flex items-center justify-center bg-slate-900/10 transition-all pointer-events-none"
        >
            <div
                class="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] px-10 py-8 rounded-[8px] shadow-sm flex flex-col items-center gap-6 pointer-events-auto"
            >
                <div
                    class="size-6 border-2 border-[#E2E8F0] dark:border-[#334155] border-t-[#64748B] dark:border-t-[#CBD5E1] animate-spin rounded-full"
                ></div>
                <p
                    class="text-[10px] font-bold text-[#64748B] dark:text-[#CBD5E1] uppercase tracking-[0.2em]"
                >
                    Calculating
                </p>
            </div>
        </div>
    {/if}

    {#if error}
        <div
            class="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4 pointer-events-none"
        >
            <div
                class="bg-white dark:bg-[#0F172A] border border-[#CBD5E1] dark:border-[#334155] border-l-4 border-l-[#EF4444] px-5 py-3 rounded-[6px] shadow-sm text-[#1E293B] dark:text-[#F8FAFC] pointer-events-auto"
            >
                <span class="text-[12px] font-medium leading-relaxed"
                    >{error}</span
                >
            </div>
        </div>
    {/if}

    <div
        class="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] flex justify-center pointer-events-none"
    >
        {#if routeData}
            <button
                onclick={clearRoute}
                class="bg-white dark:bg-[#0F172A] px-6 py-3 rounded-[6px] border border-[#CBD5E1] dark:border-[#334155] shadow-sm group transition-all hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] active:translate-y-px flex items-center gap-4 pointer-events-auto"
            >
                <span
                    class="text-[14px] font-light opacity-30 group-hover:opacity-100 transition-opacity"
                    >×</span
                >
                <span
                    class="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1E293B] dark:text-[#F8FAFC]"
                    >Clear Route</span
                >
            </button>
        {/if}
    </div>

    <footer class="absolute bottom-4 left-4 z-[100] pointer-events-none">
        <div
            class="bg-white/90 dark:bg-[#0F172A]/90 px-3 py-1.5 rounded-[4px] border border-[#CBD5E1] dark:border-[#334155] text-[9px] uppercase tracking-[0.1em] text-[#94A3B8] dark:text-[#CBD5E1] font-bold pointer-events-auto"
        >
            Property of SySLink &bull; <a
                href="https://github.com/syslink-sh"
                target="_blank"
                class="text-[#1E293B] dark:text-[#F8FAFC] hover:underline underline-offset-2"
                >GITHUB</a
            >
            &bull;
            <a
                href="https://github.com/syslink-sh/ARLTR"
                target="_blank"
                class="text-[#1E293B] dark:text-[#F8FAFC] hover:underline underline-offset-2"
                >SOURCE</a
            > &bull; 2026
        </div>
    </footer>
</div>
