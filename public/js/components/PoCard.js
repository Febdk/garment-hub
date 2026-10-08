import { getBuyerBadgeClass, getStatusBadge, isUrgentPO } from "../utils.js";

export default {
  name: "PoCard",
  props: {
    po: { type: Object, required: true },
  },
  emits: ["open-drawer"],
  setup() {
    // Helper untuk format tanggal ringkas (YYYY-MM-DD)
    const formatDateOnly = (val) => {
      if (!val) return "-";
      return val.split("T")[0];
    };

    // Fungsi pintar untuk menggabungkan lokasi rak
    const getGlobalRack = (po) => {
      if (!po.colors || po.colors.length === 0) return "BELUM SET";

      const racks = po.colors
        .map((c) => c.rack_location)
        .filter(
          (r) => r && r.trim() !== "" && r.trim().toUpperCase() !== "BELUM SET",
        );

      if (racks.length === 0) return "BELUM SET";

      const uniqueRacks = [...new Set(racks)];
      return uniqueRacks.join(", ");
    };

    return {
      getBuyerBadgeClass,
      getStatusBadge,
      isUrgentPO,
      getGlobalRack,
      formatDateOnly,
    };
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

      <!-- Ringkasan Global PO & Tanggal Shipment -->
      <div class="p-4 flex-1 space-y-2">
        <div class="flex justify-between items-center text-xs font-mono pb-2 border-b border-ink-100 dark:border-ink-700/60">
           <span class="text-gray-500 dark:text-gray-400">Ex-Fty Date:</span>
           
           <!-- Tampilan Tanggal Shipment / Revisi Dadakan -->
           <div v-if="po.revised_ex_fty_date" class="text-right">
             <span class="line-through text-ink-400 text-[10px] mr-1 block">
               {{ formatDateOnly(po.ex_fty_date) }}
             </span>
             <span class="text-alarm-600 dark:text-alarm-400 font-bold bg-alarm-50 dark:bg-alarm-900/30 px-1.5 py-0.5 rounded border border-alarm-200 dark:border-alarm-800 text-[11px] inline-flex items-center gap-1">
               ⚠️ {{ formatDateOnly(po.revised_ex_fty_date) }}
             </span>
           </div>

           <span v-else class="font-bold text-ink-900 dark:text-white">
             {{ formatDateOnly(po.ex_fty_date) }}
           </span>
        </div>

        <div class="flex justify-between items-center text-sm font-mono">
           <span class="text-gray-500 dark:text-gray-400">Total Warna:</span>
           <span class="font-bold text-ink-900 dark:text-white">{{ po.colors ? po.colors.length : 0 }} Col</span>
        </div>
        <div class="flex justify-between items-center text-sm font-mono">
           <span class="text-gray-500 dark:text-gray-400">Target Karton:</span>
           <span class="font-bold text-ink-900 dark:text-white">{{ po.colors ? po.colors.reduce((sum, c) => sum + (c.total_qty || 0), 0) : 0 }} Ktn</span>
        </div>
        
        <!-- Logika Penggabungan Rak Tampil Di Sini -->
        <div class="flex justify-between items-start text-sm font-mono pt-2 border-t border-ink-100 dark:border-ink-700">
           <span class="text-gray-500 dark:text-gray-400 mt-0.5">Lokasi Rak:</span>
           <span class="font-bold text-right text-hazard-600 dark:text-hazard-400 max-w-[60%]">
             {{ getGlobalRack(po) }}
           </span>
        </div>
      </div>

      <div class="p-3 bg-gray-50 dark:bg-ink-900/60 border-t border-ink-100 dark:border-ink-700 text-center">
        <span class="text-[11px] font-bold text-hazard-500 uppercase tracking-wider">Ketuk untuk Detail &amp; Tracking &rarr;</span>
      </div>
    </div>
  `,
};
