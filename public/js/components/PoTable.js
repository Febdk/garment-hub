import {
  formatDateTime,
  getBuyerBadgeClass,
  getStatusBadge,
  isUrgentPO,
} from "../utils.js";
import { STATUS_OPTIONS } from "../constants.js";

export default {
  name: "PoTable",
  props: {
    pos: { type: Array, required: true },
  },
  emits: [
    "edit",
    "delete",
    "status-change",
    "open-inspection",
    "export-excel",
    "print-pdf",
    "open-drawer",
  ],
  setup(props) {
    const { ref, computed, watch } = Vue;

    // ── Pagination (client-side) ──
    const PAGE_KEY = "gh_admin_page_size";
    let saved = 10;
    try {
      const v = localStorage.getItem(PAGE_KEY);
      if (v === "all") saved = 0;
      else if ([5, 10, 25, 50].includes(Number(v))) saved = Number(v);
    } catch (e) {}
    const pageSize = ref(saved);
    const page = ref(1);

    const sizeValue = computed(() =>
      pageSize.value ? String(pageSize.value) : "all",
    );
    const totalPages = computed(() =>
      pageSize.value
        ? Math.max(1, Math.ceil(props.pos.length / pageSize.value))
        : 1,
    );
    const rangeStart = computed(() =>
      props.pos.length === 0
        ? 0
        : pageSize.value
          ? (page.value - 1) * pageSize.value + 1
          : 1,
    );
    const rangeEnd = computed(() =>
      pageSize.value
        ? Math.min(page.value * pageSize.value, props.pos.length)
        : props.pos.length,
    );
    const pageNumbers = computed(() => {
      const t = totalPages.value;
      let e = Math.min(t, Math.max(1, page.value - 2) + 4);
      const s = Math.max(1, e - 4);
      const arr = [];
      for (let i = s; i <= e; i++) arr.push(i);
      return arr;
    });

    const inPage = (i) =>
      !pageSize.value ||
      (i >= (page.value - 1) * pageSize.value &&
        i < page.value * pageSize.value);
    const setPage = (n) => {
      page.value = Math.min(Math.max(1, n), totalPages.value);
    };
    const onSizeChange = (e) => {
      const v = e.target.value;
      pageSize.value = v === "all" ? 0 : Number(v);
      page.value = 1;
      try {
        localStorage.setItem(PAGE_KEY, v);
      } catch (err) {}
    };

    watch(
      () => props.pos.length,
      () => {
        if (page.value > totalPages.value) page.value = totalPages.value;
      },
    );

    return {
      formatDateTime,
      getBuyerBadgeClass,
      getStatusBadge,
      STATUS_OPTIONS,
      isUrgentPO,
      sizeValue,
      totalPages,
      rangeStart,
      rangeEnd,
      pageNumbers,
      page,
      inPage,
      setPage,
      onSizeChange,
    };
  },
  template: `
    <div class="bg-white dark:bg-ink-800 rounded-2xl shadow-xs border border-ink-200 dark:border-ink-600 p-5 flex flex-col justify-between lg:col-span-2">
      <!-- Kop Print -->
      <div class="print-header hidden">
         <!-- ... format kop cetak ... -->
      </div>

      <div>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 class="font-display text-base font-bold text-ink-900 dark:text-white">Daftar PO &amp; Shipment</h2>
            <p class="text-xs font-mono text-ink-400 font-semibold">Total: {{ pos.length }} PO</p>
          </div>
          <div class="flex items-center gap-2 no-print">
            <button @click="$emit('export-excel')" class="px-3 py-1.5 bg-stamp-50 text-stamp-700 border border-stamp-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">Excel</button>
            <button @click="$emit('print-pdf')" class="px-3 py-1.5 bg-ink-100 text-ink-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">PDF</button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-600">
          <table class="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr class="bg-paper-50 dark:bg-ink-900/60 border-b border-ink-200 dark:border-ink-600 text-[10px] text-ink-400 uppercase tracking-wider">
                <th class="p-3 font-bold">PO &amp; Style</th>
                <th class="p-3 font-bold">Shipment</th>
                <th class="p-3 font-bold">Status</th>
                <th class="p-3 font-bold text-center">Urgent</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100 dark:divide-ink-700/60 text-xs cursor-pointer">
              <tr v-if="pos.length === 0">
                <td colspan="4" class="p-6 text-center text-ink-400 font-mono">Tidak ada data PO.</td>
              </tr>
              <tr v-for="(po, idx) in pos" :key="po.id" :class="{ 'hidden': !inPage(idx) }" @click="$emit('open-drawer', po)" class="hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition align-middle">
                <td class="p-3">
                  <div class="font-bold text-ink-900 dark:text-white text-sm">PO: {{ po.po_number }}</div>
                  <div class="text-[11px] text-ink-500 dark:text-ink-400">{{ po.style_code }}</div>
                </td>
                <td class="p-3 text-ink-700 dark:text-ink-300 font-semibold">
                  {{ po.ex_fty_date ? po.ex_fty_date.split('T')[0] : '-' }}
                </td>
                <td class="p-3">
                  <span :class="getStatusBadge(po.status)" class="text-[10px] font-bold uppercase">{{ po.status }}</span>
                </td>
                <td class="p-3 text-center">
                  <span v-if="isUrgentPO(po)" class="text-alarm-500 font-bold bg-alarm-100 px-2 py-1 rounded-full animate-pulse">⚠</span>
                  <span v-else class="text-gray-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pager ... -->
        <div class="pager no-print flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs font-mono">
           <span class="text-ink-400 font-semibold">{{ rangeStart }}&ndash;{{ rangeEnd }} dari {{ pos.length }} PO</span>
           <!-- ... tombol pager ... -->
        </div>
      </div>
    </div>
  `,
};
