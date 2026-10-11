import { bulkCreatePO } from "../../api.js";

const { ref, computed } = Vue;

// Header kolom yang dikenali di file Excel/CSV. Urutan kolom di file bebas
// (dibaca berdasarkan nama header, bukan posisi), tapi NAMA header harus
// sama persis dengan ini (tidak case-sensitive, spasi di awal/akhir di-trim).
const REQUIRED_PO_FIELDS = ["po_number", "buyer", "style_code", "ex_fty_date"];

export default {
  name: "BulkUploadModal",
  props: {
    show: { type: Boolean, required: true },
    // Daftar po_number yang sudah ada di database — dipakai untuk
    // menandai baris duplikat di preview SEBELUM dikirim ke server.
    // Pengecekan final tetap dilakukan ulang di backend.
    existingPoNumbers: { type: Array, default: () => [] },
  },
  emits: ["close", "imported"],
  setup(props, { emit }) {
    const fileInputRef = ref(null);
    const fileName = ref("");
    const isParsing = ref(false);
    const isImporting = ref(false);
    const parseError = ref("");
    const parsedGroups = ref([]);
    const importResult = ref(null);

    const existingSet = computed(
      () =>
        new Set((props.existingPoNumbers || []).map((v) => String(v).trim())),
    );

    const validGroups = computed(() =>
      parsedGroups.value.filter((g) => g.valid),
    );
    const invalidGroups = computed(() =>
      parsedGroups.value.filter((g) => !g.valid),
    );

    const resetState = () => {
      fileName.value = "";
      parsedGroups.value = [];
      parseError.value = "";
      importResult.value = null;
      if (fileInputRef.value) fileInputRef.value.value = "";
    };

    const closeModal = () => {
      resetState();
      emit("close");
    };

    const downloadTemplate = () => {
      const headers = [
        "po_number",
        "buyer",
        "style_code",
        "ex_fty_date",
        "color_code",
        "total_qty",
        "carton_qty",
        "rack_location",
        "helper_name",
      ];
      const example1 = [
        "4702177999",
        "Polo Ralph Lauren",
        "710999999",
        "2026-12-01",
        "018",
        "100",
        "0",
        "",
        "",
      ];
      // Baris kedua contoh: PO sama dengan warna kedua (1 PO bisa punya
      // beberapa baris warna, selama po_number/buyer/style_code/ex_fty_date-nya sama).
      const example2 = [
        "4702177999",
        "Polo Ralph Lauren",
        "710999999",
        "2026-12-01",
        "019",
        "50",
        "0",
        "",
        "",
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
      ws["!cols"] = headers.map(() => ({ wch: 16 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template PO");
      XLSX.writeFile(wb, "template-bulk-po.xlsx");
    };

    const normalizeHeader = (key) =>
      String(key || "")
        .trim()
        .toLowerCase();

    const normalizeDate = (val) => {
      if (val === null || val === undefined || val === "") return "";
      if (val instanceof Date && !isNaN(val)) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, "0");
        const d = String(val.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
      const str = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
      // Dukung format umum DD/MM/YYYY (lokal ID) juga
      const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m1) {
        const [, d, mo, y] = m1;
        return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      return str;
    };

    const parseFile = async (file) => {
      resetState();
      fileName.value = file.name;
      isParsing.value = true;
      try {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rawRows.length === 0) {
          parseError.value = "File kosong atau format tidak terbaca.";
          return;
        }

        const normalizedRows = rawRows.map((row) => {
          const out = {};
          Object.keys(row).forEach((k) => {
            out[normalizeHeader(k)] = row[k];
          });
          return out;
        });

        const missingHeader = REQUIRED_PO_FIELDS.find(
          (f) => !(f in normalizedRows[0]),
        );
        if (missingHeader) {
          parseError.value = `Kolom "${missingHeader}" tidak ditemukan di file. Pastikan pakai template yang disediakan.`;
          return;
        }

        // Group baris jadi per PO (po_number sama = 1 PO, boleh beberapa baris warna)
        const groups = new Map();
        const order = [];
        normalizedRows.forEach((row, idx) => {
          const po_number = String(row.po_number || "").trim();
          const key = po_number || `__blank_${idx}`;
          if (!groups.has(key)) {
            groups.set(key, {
              po_number,
              buyer: String(row.buyer || "").trim(),
              style_code: String(row.style_code || "").trim(),
              ex_fty_date: normalizeDate(row.ex_fty_date),
              colors: [],
              firstRow: idx + 2,
            });
            order.push(key);
          }
          const g = groups.get(key);
          const color_code = String(row.color_code || "").trim();
          if (color_code) {
            g.colors.push({
              color_code,
              total_qty: Number(row.total_qty) || 0,
              carton_qty: Number(row.carton_qty) || 0,
              rack_location: String(row.rack_location || "").trim(),
              helper_name: String(row.helper_name || "").trim(),
            });
          }
        });

        const seen = new Set();
        parsedGroups.value = order.map((key) => {
          const g = groups.get(key);
          let valid = true;
          let reason = "";

          if (!g.po_number || !g.buyer || !g.style_code || !g.ex_fty_date) {
            valid = false;
            reason =
              "Field wajib kosong (po_number / buyer / style_code / ex_fty_date)";
          } else if (existingSet.value.has(g.po_number)) {
            valid = false;
            reason = "PO Number sudah ada di database";
          } else if (seen.has(g.po_number)) {
            valid = false;
            reason = "PO Number duplikat di dalam file ini";
          } else {
            seen.add(g.po_number);
          }

          return { ...g, valid, reason };
        });
      } catch (err) {
        parseError.value =
          "Gagal membaca file. Pastikan formatnya .xlsx, .xls, atau .csv sesuai template.";
      } finally {
        isParsing.value = false;
      }
    };

    const handleFileChange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) parseFile(file);
    };

    const confirmImport = async () => {
      const rows = validGroups.value.map((g) => ({
        buyer: g.buyer,
        po_number: g.po_number,
        style_code: g.style_code,
        ex_fty_date: g.ex_fty_date,
        colors: g.colors,
      }));
      if (rows.length === 0) return;

      isImporting.value = true;
      parseError.value = "";
      try {
        const res = await bulkCreatePO(rows);
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          importResult.value = data;
          emit("imported");
        } else {
          parseError.value = data.error || "Gagal mengimpor data.";
        }
      } catch (err) {
        parseError.value = "Terjadi kesalahan koneksi server.";
      } finally {
        isImporting.value = false;
      }
    };

    return {
      fileInputRef,
      fileName,
      isParsing,
      isImporting,
      parseError,
      parsedGroups,
      validGroups,
      invalidGroups,
      importResult,
      downloadTemplate,
      handleFileChange,
      confirmImport,
      closeModal,
      resetState,
    };
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-ink-200 dark:border-ink-600 my-8">
        <div class="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-ink-700">
          <h3 class="font-display text-base font-bold text-ink-900 dark:text-white">
            Upload Massal PO
          </h3>
          <button type="button" @click="closeModal" class="text-ink-400 hover:text-ink-600 font-bold">✕</button>
        </div>

        <!-- STEP 1: Belum ada hasil import -->
        <div v-if="!importResult" class="space-y-4 mt-4">
          <div class="flex flex-wrap items-center gap-3 bg-paper-50 dark:bg-ink-700 p-3 rounded-xl border border-ink-200 dark:border-ink-600">
            <button type="button" @click="downloadTemplate"
              class="text-xs bg-white dark:bg-ink-800 border border-ink-300 dark:border-ink-600 text-ink-700 dark:text-ink-200 px-3 py-2 rounded-lg font-data font-bold hover:bg-ink-50 dark:hover:bg-ink-600 transition">
              ⬇ Download Template
            </button>
            <span class="text-xs text-ink-400">Isi template, lalu upload file-nya di bawah ini.</span>
          </div>

          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">File Excel / CSV</label>
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls,.csv"
              @change="handleFileChange"
              class="w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-hazard-500 file:text-ink-900 file:font-bold file:text-xs file:cursor-pointer bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl text-ink-600 dark:text-ink-300"
            />
          </div>

          <div v-if="isParsing" class="text-center text-sm text-ink-400 py-6">
            Membaca file...
          </div>

          <div v-if="parseError" class="p-3 bg-alarm-50 dark:bg-alarm-950/60 border border-alarm-200 dark:border-alarm-900 text-alarm-700 dark:text-alarm-300 rounded-xl text-xs font-semibold font-data">
            {{ parseError }}
          </div>

          <!-- PREVIEW TABLE -->
          <div v-if="parsedGroups.length > 0 && !isParsing" class="space-y-2">
            <div class="flex items-center gap-3 text-xs font-data font-bold">
              <span class="text-stamp-600 dark:text-stamp-400">{{ validGroups.length }} valid — akan diimport</span>
              <span v-if="invalidGroups.length > 0" class="text-alarm-600 dark:text-alarm-400">{{ invalidGroups.length }} dilewati</span>
            </div>
            <div class="max-h-80 overflow-y-auto border border-ink-200 dark:border-ink-600 rounded-xl">
              <table class="w-full text-xs font-data">
                <thead class="bg-paper-100 dark:bg-ink-700 sticky top-0">
                  <tr class="text-left text-ink-500 dark:text-ink-300 uppercase text-[10px]">
                    <th class="px-3 py-2">Baris</th>
                    <th class="px-3 py-2">PO Number</th>
                    <th class="px-3 py-2">Buyer</th>
                    <th class="px-3 py-2">Style</th>
                    <th class="px-3 py-2">Ex-Fty Date</th>
                    <th class="px-3 py-2">Warna</th>
                    <th class="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in parsedGroups" :key="g.firstRow"
                    :class="g.valid ? '' : 'bg-alarm-50 dark:bg-alarm-950/30'"
                    class="border-t border-ink-100 dark:border-ink-700">
                    <td class="px-3 py-2 text-ink-400">{{ g.firstRow }}</td>
                    <td class="px-3 py-2 font-semibold text-ink-800 dark:text-white">{{ g.po_number || '—' }}</td>
                    <td class="px-3 py-2">{{ g.buyer || '—' }}</td>
                    <td class="px-3 py-2">{{ g.style_code || '—' }}</td>
                    <td class="px-3 py-2">{{ g.ex_fty_date || '—' }}</td>
                    <td class="px-3 py-2">{{ g.colors.length }} warna</td>
                    <td class="px-3 py-2">
                      <span v-if="g.valid" class="text-stamp-600 dark:text-stamp-400 font-bold">✓ Valid</span>
                      <span v-else class="text-alarm-600 dark:text-alarm-400 font-bold" :title="g.reason">✕ {{ g.reason }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex space-x-3 pt-3 border-t border-ink-100 dark:border-ink-700">
            <button type="button" @click="closeModal" class="w-1/2 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 text-ink-700 dark:text-ink-300 py-2.5 rounded-xl text-sm font-data font-bold transition">
              Batal
            </button>
            <button type="button" @click="confirmImport" :disabled="validGroups.length === 0 || isImporting"
              class="w-1/2 bg-hazard-500 hover:bg-hazard-600 disabled:opacity-40 disabled:cursor-not-allowed text-ink-900 py-2.5 rounded-xl text-sm font-data font-bold transition shadow-sm">
              {{ isImporting ? 'Mengimpor...' : 'Import ' + validGroups.length + ' PO' }}
            </button>
          </div>
        </div>

        <!-- STEP 2: Hasil import -->
        <div v-else class="space-y-4 mt-4">
          <div class="p-4 bg-stamp-50 dark:bg-stamp-700/20 border border-stamp-200 dark:border-stamp-700 rounded-xl text-sm font-data font-semibold text-stamp-700 dark:text-stamp-300">
            {{ importResult.message }}
          </div>

          <div v-if="importResult.skipped && importResult.skipped.length > 0" class="space-y-2">
            <p class="text-xs font-data font-bold text-ink-500 dark:text-ink-300 uppercase">Detail yang dilewati:</p>
            <div class="max-h-64 overflow-y-auto border border-ink-200 dark:border-ink-600 rounded-xl">
              <table class="w-full text-xs font-data">
                <thead class="bg-paper-100 dark:bg-ink-700 sticky top-0">
                  <tr class="text-left text-ink-500 dark:text-ink-300 uppercase text-[10px]">
                    <th class="px-3 py-2">Baris</th>
                    <th class="px-3 py-2">PO Number</th>
                    <th class="px-3 py-2">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in importResult.skipped" :key="s.row" class="border-t border-ink-100 dark:border-ink-700">
                    <td class="px-3 py-2 text-ink-400">{{ s.row }}</td>
                    <td class="px-3 py-2 font-semibold">{{ s.po_number }}</td>
                    <td class="px-3 py-2 text-alarm-600 dark:text-alarm-400">{{ s.reason }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex space-x-3 pt-3 border-t border-ink-100 dark:border-ink-700">
            <button type="button" @click="resetState" class="w-1/2 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 text-ink-700 dark:text-ink-300 py-2.5 rounded-xl text-sm font-data font-bold transition">
              Upload File Lain
            </button>
            <button type="button" @click="closeModal" class="w-1/2 bg-hazard-500 hover:bg-hazard-600 text-ink-900 py-2.5 rounded-xl text-sm font-data font-bold transition shadow-sm">
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
};
