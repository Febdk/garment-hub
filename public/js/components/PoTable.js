import {
  formatDateTime,
  getBuyerBadgeClass,
  getStatusBadge,
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
    "open-drawer", // <-- Event untuk membuka Drawer V6
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
      
      <!-- KOP LAPORAN RESMI KHUSUS CETAK/PDF -->
      <div class="print-header hidden">
         <!-- (Sengaja disembunyikan di layar, khusus print) -->
      </div>

      <div>
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 class="font-display text-base font-bold text-ink-900 dark:text-white">
              Tabel Monitoring PO, Inspeksi &amp; Shipment
            </h2>
            <p class="text-xs font-mono text-ink-400 font-semibold">Total: {{ pos.length }} Record</p>
          </div>

          <div class="flex items-center gap-2 no-print">
            <button @click="$emit('export-excel')" class="px-3 py-1.5 bg-stamp-50 hover:bg-stamp-100 text-stamp-700 border border-stamp-200 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">Excel</button>
            <button @click="$emit('print-pdf')" class="px-3 py-1.5 bg-ink-100 hover:bg-ink-200 text-ink-800 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">Cetak / PDF</button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-600">
          <table class="po-table w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr class="bg-paper-50 dark:bg-ink-900/60 border-b border-ink-200 dark:border-ink-600 text-[10px] font-mono font-bold text-ink-400 uppercase tracking-wider">
                <th class="p-2.5">Buyer / PO &amp; Style</th>
                <th class="p-2.5">Breakdown Warna</th>
                <th class="p-2.5">Status &amp; Log Inspeksi</th>
                <th class="p-2.5 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100 dark:divide-ink-700/60 text-xs">
              <tr v-if="pos.length === 0">
                <td colspan="4" class="p-6 text-center text-ink-400 font-mono">Tidak ada data PO yang sesuai.</td>
              </tr>
              <tr v-for="(po, idx) in pos" :key="po.id" :class="{ 'page-hidden': !inPage(idx) }" class="po-row hover:bg-paper-50/80 dark:hover:bg-ink-700/20 transition align-top">
                <td class="p-2.5 space-y-0.5">
                  <div class="flex items-center gap-1.5">
                    <img v-if="po.buyer_logo" :src="po.buyer_logo" class="w-4 h-4 object-contain no-print" @error="$event.target.style.display='none'" />
                    <span :class="getBuyerBadgeClass(po.buyer)" class="text-[10px] font-mono font-bold">{{ po.buyer }}</span>
                  </div>
                  <div class="font-mono font-bold text-ink-900 dark:text-white text-sm">PO: {{ po.po_number }}</div>
                  <div class="text-[11px] text-ink-500 dark:text-ink-400 font-mono">
                    Style: <b class="text-ink-700 dark:text-ink-200">{{ po.style_code }}</b>
                  </div>
                  <div class="text-[10px] text-ink-400 font-mono">
                    Ex-Fty: {{ po.ex_fty_date ? po.ex_fty_date.split('T')[0] : '-' }}
                  </div>
                </td>

                <td data-label="Warna &amp; rak" class="p-2.5 space-y-1 font-mono">
                  <div v-for="c in po.colors" :key="c.id" class="text-[11px] py-0.5">
                    <span class="font-bold text-ink-800 dark:text-ink-200">Col {{ c.color_code }}</span>:
                    <span class="font-semibold text-ink-600 dark:text-ink-300">{{ c.total_qty }} Ktn</span>
                    <span class="text-stamp-600 dark:text-stamp-400 text-[10px] block">Rak: {{ c.rack_location || 'BELUM SET' }}</span>
                  </div>
                </td>

                <td data-label="Status" class="p-2.5 space-y-1.5 font-mono">
                  <span :class="getStatusBadge(po.status)" class="text-[10px] font-bold uppercase tracking-wider">{{ po.status }}</span>

                  <div v-if="po.status === 'Inspection Internal'" class="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">
                    <div class="flex justify-between items-center">
                      <span>QC Internal: {{ po.inspection_internal_by || 'Tim QC' }}</span>
                      <button type="button" @click="$emit('open-inspection', po, 'Inspection Internal')" class="text-indigo-600 underline font-bold cursor-pointer no-print">Edit</button>
                    </div>
                    <div class="text-[10px] text-indigo-500">{{ formatDateTime(po.inspection_internal_at) }}</div>
                  </div>

                  <select
                    @change="$emit('status-change', po, $event.target.value)"
                    class="block w-full text-[11px] font-mono border border-ink-200 dark:border-ink-600 rounded-lg p-1 bg-white dark:bg-ink-700 text-ink-800 dark:text-white font-semibold focus:ring-1 focus:ring-hazard-500 no-print"
                  >
                    <option disabled value="">Ubah Status Milestone...</option>
                    <option v-for="s in STATUS_OPTIONS" :key="s" :value="s" :selected="po.status === s">{{ s }}</option>
                  </select>
                </td>

                <td class="po-actions p-2.5 text-center align-middle no-print">
                  <div class="flex flex-col gap-1.5 font-mono">
                    <!-- Tombol Tracking Karton V6 -->
                    <button
                      type="button"
                      @click="$emit('open-drawer', po)"
                      class="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1.5 rounded-lg font-bold text-[11px] transition shadow-sm w-full flex items-center justify-center gap-1"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      Tracking
                    </button>
                    
                    <div class="flex gap-1.5 justify-center w-full">
                      <button
                        type="button"
                        @click="$emit('edit', po)"
                        class="bg-ink-100 hover:bg-ink-200 text-ink-800 px-2 py-1 rounded font-semibold text-[11px] transition w-full"
                        title="Edit Master PO"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        @click="$emit('delete', po.id, po.po_number)"
                        class="bg-alarm-50 hover:bg-alarm-100 text-alarm-700 px-2 py-1 rounded font-semibold text-[11px] transition w-full"
                        title="Hapus PO"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pengaturan Halaman -->
        <div class="pager no-print flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs font-mono">
          <label class="flex items-center gap-2 font-semibold text-ink-500">
            Tampilkan
            <select :value="sizeValue" @change="onSizeChange" class="px-2 py-1.5 border border-ink-200 rounded-xl bg-paper-50 font-bold">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="all">Semua</option>
            </select>
          </label>
          <span class="text-ink-400 font-semibold">{{ rangeStart }}&ndash;{{ rangeEnd }} dari {{ pos.length }} PO</span>
          <div v-if="totalPages > 1" class="flex items-center gap-1">
            <button type="button" :disabled="page === 1" @click="setPage(page - 1)" class="pager-btn">&lsaquo;</button>
            <button v-for="n in pageNumbers" :key="n" type="button" @click="setPage(n)" :class="n === page ? 'pager-btn pager-active' : 'pager-btn'">{{ n }}</button>
            <button type="button" :disabled="page === totalPages" @click="setPage(page + 1)" class="pager-btn">&rsaquo;</button>
          </div>
        </div>
      </div>
    </div>
  `,
};
