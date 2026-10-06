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
  emits: ["open-placement", "open-drawer"],
  setup() {
    return { formatDateTime, getBuyerBadgeClass, getStatusBadge, isUrgentPO };
  },
  template: `
    <div
      @click="$emit('open-drawer', po)"
      class="bg-white dark:bg-ink-800 rounded-xl shadow-xs border border-ink-200 dark:border-ink-700 overflow-hidden flex flex-col hover:border-hazard-500 transition cursor-pointer"
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
            Shipment: <span class="text-ink-700 dark:text-ink-200 font-semibold">{{ po.ex_fty_date ? po.ex_fty_date.split('T')[0] : '-' }}</span>
          </p>
        </div>
      </div>

      <div class="p-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div class="text-xs font-mono text-gray-500 dark:text-gray-400">
          Total Target: <span class="font-bold text-gray-800 dark:text-gray-200">{{ po.colors ? po.colors.reduce((sum, c) => sum + (c.total_qty || 0), 0) : 0 }} CTN</span>
        </div>
        <div class="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
          Ketuk untuk detail &rarr;
        </div>
      </div>
    </div>
  `,
};
