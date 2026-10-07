import { getBuyerBadgeClass, getStatusBadge, isUrgentPO } from "../utils.js";

export default {
  name: "PoCard",
  props: {
    po: { type: Object, required: true },
  },
  emits: ["open-drawer"],
  setup() {
    return { getBuyerBadgeClass, getStatusBadge, isUrgentPO };
  },
  template: `
    <div
      @click="$emit('open-drawer', po)"
      class="bg-white dark:bg-ink-800 rounded-xl shadow-xs border border-ink-200 dark:border-ink-700 overflow-hidden flex flex-col hover:border-hazard-500 transition cursor-pointer relative"
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
        </div>
      </div>

      <!-- Ringkasan Global PO (Sangat Simple) -->
      <div class="p-4 flex-1">
        <div class="flex justify-between items-center text-sm font-mono mb-2">
           <span class="text-gray-500 dark:text-gray-400">Total Warna:</span>
           <span class="font-bold text-white">{{ po.colors ? po.colors.length : 0 }} Col</span>
        </div>
        <div class="flex justify-between items-center text-sm font-mono">
           <span class="text-gray-500 dark:text-gray-400">Target Karton:</span>
           <span class="font-bold text-white">{{ po.colors ? po.colors.reduce((sum, c) => sum + (c.total_qty || 0), 0) : 0 }} Ktn</span>
        </div>
      </div>

      <div class="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-700 text-center">
        <span class="text-xs font-bold text-yellow-500 uppercase tracking-wider">Ketuk untuk Detail &amp; Tracking &rarr;</span>
      </div>
    </div>
  `,
};
