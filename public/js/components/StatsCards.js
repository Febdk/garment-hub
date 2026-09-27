export default {
  name: "StatsCards",
  props: {
    stats: { type: Object, required: true },
    criticalCount: { type: Number, required: true },
  },
  emits: ["toggle-urgent"],
  template: `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-ink-800 rounded-2xl p-4 border border-ink-200 dark:border-ink-600 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-[11px] font-data uppercase tracking-wider text-ink-400">Total PO</p>
          <h3 class="font-display text-2xl font-bold text-ink-900 dark:text-paper-50 mt-1">
            {{ stats.total_po }}
          </h3>
        </div>
        <div class="tag border-2 text-ink-500 dark:text-ink-300 px-2 py-1.5">PO</div>
      </div>

      <div class="bg-white dark:bg-ink-800 rounded-2xl p-4 border border-ink-200 dark:border-ink-600 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-[11px] font-data uppercase tracking-wider text-ink-400">Karton Masuk</p>
          <h3 class="font-display text-2xl font-bold text-ink-900 dark:text-paper-50 mt-1">
            {{ stats.total_actual_cartons }}
            <span class="font-data text-xs text-ink-400 font-normal">/ {{ stats.total_target_cartons }}</span>
          </h3>
        </div>
        <div class="tag border-2 text-indigo-600 dark:text-indigo-300 px-2 py-1.5">CTN</div>
      </div>

      <div class="bg-white dark:bg-ink-800 rounded-2xl p-4 border border-ink-200 dark:border-ink-600 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-[11px] font-data uppercase tracking-wider text-ink-400">Ready to Ship</p>
          <h3 class="font-display text-2xl font-bold text-stamp-600 dark:text-stamp-300 mt-1">
            {{ stats.ready_to_ship }}
          </h3>
        </div>
        <div class="tag border-2 text-stamp-600 dark:text-stamp-300 px-2 py-1.5">RTS</div>
      </div>

      <button
        type="button"
        @click="$emit('toggle-urgent')"
        class="bg-alarm-50/70 dark:bg-alarm-700/20 rounded-2xl p-4 border border-alarm-300 dark:border-alarm-600 shadow-sm flex items-center justify-between text-left hover:border-alarm-500 transition"
      >
        <div>
          <p class="text-[11px] font-data font-bold uppercase tracking-wider text-alarm-600 dark:text-alarm-300">
            Urgent (H-2 / Inspeksi)
          </p>
          <h3 class="font-display text-2xl font-bold text-alarm-700 dark:text-alarm-300 mt-1">
            {{ criticalCount }} PO
          </h3>
        </div>
        <div class="stamp text-alarm-600 dark:text-alarm-300 animate-pulse">URG</div>
      </button>
    </div>
  `,
};
