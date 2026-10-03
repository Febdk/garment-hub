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
  emits: ["toggle-urgent", "open-inspection"],
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
              Panel Atensi PO Kritikal &amp; Urgent ({{ criticalPos.length }} PO)
            </h3>
            <p class="crit-desc text-xs text-ink-400">
              PO berstatus Inspeksi Aktif atau Tanggal Shipment berjarak &le; 2 hari (H-2 s/d Hari H).
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('toggle-urgent')"
          class="crit-btn text-xs font-data font-bold px-3 py-1.5 rounded-xl border transition"
          :class="filterUrgentOnly ? 'bg-alarm-600 text-white border-alarm-600' : 'bg-alarm-50 dark:bg-alarm-700/20 text-alarm-700 dark:text-alarm-300 border-alarm-300 dark:border-alarm-700 hover:bg-alarm-100'"
        >
          {{ filterUrgentOnly ? 'Tampilkan Semua PO' : 'Filter Urgent' }}
        </button>
      </div>

      <div class="crit-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        <div
          v-for="cpo in criticalPos"
          :key="'crit-' + cpo.id"
          class="crit-card bg-white dark:bg-ink-700/60 p-3.5 rounded-xl border border-alarm-200 dark:border-alarm-700/60 shadow-xs flex flex-col justify-between gap-2"
        >
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-2">
              <img v-if="cpo.buyer_logo" :src="cpo.buyer_logo" class="w-4 h-4 object-contain" @error="$event.target.style.display='none'" />
              <span class="font-display font-bold text-ink-900 dark:text-white text-sm">PO: {{ cpo.po_number }}</span>
            </div>
            <span class="text-[10px]" :class="getStatusBadge(cpo.status)">{{ cpo.status }}</span>
          </div>

          <div class="text-xs space-y-1">
            <p class="text-ink-500 dark:text-ink-300">
              Buyer: <b class="text-ink-800 dark:text-ink-100">{{ cpo.buyer }}</b>
              | Style: <b>{{ cpo.style_code }}</b>
            </p>

            <div
              v-if="cpo.status === 'Inspection Internal'"
              class="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-800 dark:text-indigo-200 font-medium"
            >
              <div class="flex justify-between items-center">
                <span>QC Internal: {{ cpo.inspection_internal_by || 'Tim QC Internal' }}</span>
                <button type="button" @click="$emit('open-inspection', cpo, 'Inspection Internal')" class="text-[10px] text-indigo-600 font-bold underline">
                  Ubah
                </button>
              </div>
              <div class="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-data">
                {{ formatDateTime(cpo.inspection_internal_at) }}
              </div>
            </div>

            <div
              v-if="cpo.status === 'Inspection External'"
              class="bg-sky-50 dark:bg-sky-950/40 p-2 rounded-lg border border-sky-100 dark:border-sky-900/60 text-[11px] text-sky-800 dark:text-sky-200 font-medium"
            >
              <div class="flex justify-between items-center">
                <span>Auditor Eksternal: {{ cpo.inspection_external_by || 'Auditor External' }}</span>
                <button type="button" @click="$emit('open-inspection', cpo, 'Inspection External')" class="text-[10px] text-sky-600 font-bold underline">
                  Ubah
                </button>
              </div>
              <div class="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5 font-data">
                {{ formatDateTime(cpo.inspection_external_at) }}
              </div>
            </div>

            <div class="bg-hazard-50 dark:bg-hazard-700/10 p-2 rounded-lg border border-hazard-200 dark:border-hazard-700/40 text-[11px] text-hazard-800 dark:text-hazard-300 font-medium">
              <div class="flex justify-between items-center">
                <span class="font-data">{{ (cpo.revised_ex_fty_date || cpo.ex_fty_date || '').split('T')[0] }}</span>
                <span class="text-[10px] font-bold text-alarm-600 dark:text-alarm-300 bg-alarm-100 dark:bg-alarm-700/30 px-1.5 py-0.5 rounded font-data">
                  {{ getUrgencyBadgeText(cpo) }}
                </span>
              </div>
              <div v-if="cpo.shipment_note" class="text-[10px] text-hazard-700 dark:text-hazard-300 mt-0.5">
                Catatan: {{ cpo.shipment_note }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
};
