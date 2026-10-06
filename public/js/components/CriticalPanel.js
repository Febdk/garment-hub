import {
  formatDateTime,
  getStatusBadge,
  getUrgencyBadgeText,
} from "../utils.js";

export default {
  name: "CriticalPanel",
  props: {
    criticalPos: { type: Array, required: true },
    filterUrgentOnly: { type: Boolean, required: true },
  },
  emits: ["toggle-urgent", "open-drawer"],
  setup() {
    return { formatDateTime, getStatusBadge, getUrgencyBadgeText };
  },
  template: `
    <div
      v-if="criticalPos.length > 0"
      class="critical-panel bg-gradient-to-r from-alarm-500/10 via-hazard-500/5 to-transparent border-l-4 border-alarm-500 rounded-2xl p-5 bg-white dark:bg-ink-800 shadow-sm border border-ink-200 dark:border-ink-600 space-y-3"
    >
      <div class="crit-head flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="stamp text-alarm-600 dark:text-alarm-300">!!</span>
          <div>
            <h3 class="font-display text-sm font-bold text-alarm-700 dark:text-alarm-300">
              Panel Urgent ({{ criticalPos.length }} PO)
            </h3>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('toggle-urgent')"
          class="crit-btn text-xs font-data font-bold px-3 py-1.5 rounded-xl border transition"
          :class="filterUrgentOnly ? 'bg-alarm-600 text-white border-alarm-600' : 'bg-alarm-50 dark:bg-alarm-700/20 text-alarm-700 dark:text-alarm-300 border-alarm-300 dark:border-alarm-700 hover:bg-alarm-100'"
        >
          {{ filterUrgentOnly ? 'Semua' : 'Filter' }}
        </button>
      </div>

      <div class="crit-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        <div
          v-for="cpo in criticalPos"
          :key="'crit-' + cpo.id"
          @click="$emit('open-drawer', cpo)"
          class="crit-card cursor-pointer bg-white dark:bg-ink-700/60 p-3 rounded-xl border border-alarm-200 dark:border-alarm-700/60 shadow-xs hover:bg-alarm-50 transition"
        >
          <div class="flex justify-between items-center mb-1">
            <span class="font-bold text-ink-900 dark:text-white text-sm">{{ cpo.po_number }}</span>
            <span class="text-[10px]" :class="getStatusBadge(cpo.status)">{{ cpo.status }}</span>
          </div>
          <div class="flex justify-between items-end">
            <div class="text-[10px] font-mono text-ink-500">{{ cpo.style_code }}</div>
            <span class="text-[10px] font-bold text-alarm-600 dark:text-alarm-300 bg-alarm-100 dark:bg-alarm-700/30 px-1.5 py-0.5 rounded">
              {{ getUrgencyBadgeText(cpo) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
};
