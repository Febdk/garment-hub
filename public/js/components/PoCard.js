import {
  formatDateTime,
  getBuyerBadgeClass,
  getStatusBadge,
  isUrgentPO,
} from "../utils.js";

export default {
  name: "PoCard",
  props: {
    po: { type: Object, required: true },
  },
  emits: ["open-placement"],
  setup() {
    return { formatDateTime, getBuyerBadgeClass, getStatusBadge, isUrgentPO };
  },
  template: `
    <div
      class="bg-white dark:bg-ink-800 rounded-xl shadow-xs border border-ink-200 dark:border-ink-700 overflow-hidden flex flex-col hover:border-hazard-500 transition"
      :class="{ 'border-l-4 border-l-alarm-500': isUrgentPO(po) }"
    >
      <div class="p-4 border-b border-ink-100 dark:border-ink-700/60 bg-paper-50/60 dark:bg-ink-900/40 flex justify-between items-start gap-2">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <img v-if="po.buyer_logo" :src="po.buyer_logo" :alt="po.buyer" class="w-4 h-4 object-contain rounded" @error="$event.target.style.display='none'" />
            <span :class="getBuyerBadgeClass(po.buyer)" class="text-[10px] font-mono tracking-wider font-bold">{{ po.buyer }}</span>
          </div>
          <h3 class="font-mono text-base font-bold text-ink-900 dark:text-white tracking-tight">
            PO: {{ po.po_number }}
          </h3>
          <p class="text-[11px] text-ink-500 dark:text-ink-400 font-mono">
            Style: <span class="font-mono font-bold text-ink-800 dark:text-ink-100">{{ po.style_code }}</span>
          </p>
        </div>

        <div class="text-right space-y-0.5">
          <span :class="getStatusBadge(po.status)" class="text-[10px] font-mono uppercase font-bold tracking-wider">{{ po.status }}</span>
          <p class="text-[10px] font-mono text-ink-400">
            Ex-Fty: <span class="text-ink-700 dark:text-ink-200 font-semibold">{{ po.ex_fty_date ? po.ex_fty_date.split('T')[0] : '-' }}</span>
          </p>
          <p v-if="po.revised_ex_fty_date" class="text-[10px] font-mono font-bold text-hazard-600 dark:text-hazard-400">
            Revisi: {{ po.revised_ex_fty_date.split('T')[0] }}
          </p>
        </div>
      </div>

      <div v-if="po.status === 'Inspection Internal'" class="mx-4 mt-2.5 p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-lg border border-indigo-100 dark:border-indigo-900/60 text-[11px] font-mono text-indigo-900 dark:text-indigo-200 space-y-0.5">
        <div class="flex justify-between font-bold">
          <span>Inspection Internal:</span>
          <span class="text-[10px] text-indigo-600 dark:text-indigo-300">{{ formatDateTime(po.inspection_internal_at) }}</span>
        </div>
        <div class="text-indigo-700 dark:text-indigo-300">
          Inspector: <b>{{ po.inspection_internal_by || 'Tim QC Internal' }}</b>
        </div>
      </div>

      <div v-if="po.status === 'Inspection External'" class="mx-4 mt-2.5 p-2 bg-sky-50/80 dark:bg-sky-950/40 rounded-lg border border-sky-100 dark:border-sky-900/60 text-[11px] font-mono text-sky-900 dark:text-sky-200 space-y-0.5">
        <div class="flex justify-between font-bold">
          <span>Inspection External:</span>
          <span class="text-[10px] text-sky-600 dark:text-sky-300">{{ formatDateTime(po.inspection_external_at) }}</span>
        </div>
        <div class="text-sky-700 dark:text-sky-300">
          Auditor: <b>{{ po.inspection_external_by || 'Auditor External' }}</b>
        </div>
      </div>

      <div class="p-4 flex-1 space-y-2.5">
        <p class="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-400">
          Breakdown Warna &amp; Penempatan Rak
        </p>
        <div
          v-for="color in po.colors"
          :key="color.id"
          class="bg-paper-50 dark:bg-ink-700/40 p-3 rounded-lg border border-ink-200/60 dark:border-ink-600/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5"
        >
          <div class="space-y-1 flex-1 w-full">
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">COL: {{ color.color_code }}</span>
              <span class="text-[11px] font-mono text-ink-600 dark:text-ink-300">
                Target: <b class="font-mono text-ink-900 dark:text-white">{{ color.total_qty }}</b> Ktn
              </span>
            </div>

            <div class="w-full bg-ink-200 dark:bg-ink-600 h-1.5 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="color.carton_qty >= color.total_qty ? 'bg-stamp-500' : 'bg-hazard-500'"
                :style="{ width: Math.min(100, Math.round(((color.carton_qty || 0) / (color.total_qty || 1)) * 100)) + '%' }"
              ></div>
            </div>

            <div class="text-[11px] text-ink-500 dark:text-ink-400 flex flex-wrap justify-between items-center font-mono mt-1">
              <span>Rak: <b class="text-ink-900 dark:text-white font-bold">{{ color.rack_location || 'BELUM SET' }}</b></span>
              <span>Fisik: <b class="text-ink-900 dark:text-white font-bold">{{ color.carton_qty || 0 }} Ktn</b></span>
              <span v-if="color.helper_name" class="text-ink-400 text-[10px]">Helper: {{ color.helper_name }}</span>
            </div>
          </div>

          <button
            type="button"
            @click="$emit('open-placement', po, color)"
            class="w-full sm:w-auto bg-hazard-500 hover:bg-hazard-600 text-ink-900 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shadow-2xs transition flex items-center justify-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Rak</span>
          </button>
        </div>
      </div>
    </div>
  `,
};
