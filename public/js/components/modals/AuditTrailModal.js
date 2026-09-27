export default {
  name: "AuditTrailModal",
  props: {
    show: Boolean,
  },
  emits: ["close"],
  data() {
    return {
      logs: [],
      isLoading: false,
    };
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.fetchLogs();
      }
    },
  },
  methods: {
    async fetchLogs() {
      this.isLoading = true;
      try {
        const res = await fetch("/api/audit-logs");
        if (res.ok) {
          this.logs = await res.json();
        }
      } catch (err) {
        console.error("Gagal memuat audit log:", err);
      } finally {
        this.isLoading = false;
      }
    },
    formatDate(dtStr) {
      if (!dtStr) return "-";
      return dtStr.replace("T", " ").slice(0, 19);
    },
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-ink-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-ink-200 dark:border-ink-700 flex flex-col max-h-[85vh]">
        
        <!-- Header Modal -->
        <div class="flex justify-between items-center pb-4 border-b border-ink-100 dark:border-ink-700">
          <div>
            <h3 class="font-display text-lg font-bold text-ink-900 dark:text-white">
              Audit Trail &amp; Log Aktivitas Pabrik
            </h3>
            <p class="text-xs font-mono text-ink-400">Riwayat digital operasional gudang dan rekam jejak pengguna.</p>
          </div>
          <!-- Tombol Silang Close -->
          <button @click="$emit('close')" class="text-ink-400 hover:text-ink-700 dark:hover:text-white font-bold text-lg p-1 cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Body / Tabel Log -->
        <div class="flex-1 overflow-y-auto py-4">
          <div v-if="isLoading" class="text-center py-10 font-mono text-xs text-ink-400">
            Memuat riwayat aktivitas...
          </div>
          <div v-else-if="logs.length === 0" class="text-center py-10 font-mono text-xs text-ink-400">
            Belum ada catatan aktivitas yang terekam. (Coba lakukan aksi seperti tambah PO atau login untuk mengisi log).
          </div>
          <div v-else class="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700">
            <table class="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr class="bg-paper-50 dark:bg-ink-900/80 border-b border-ink-200 dark:border-ink-700 text-[10px] text-ink-400 uppercase tracking-wider">
                  <th class="p-3">Waktu (Timestamp)</th>
                  <th class="p-3">User / Akun</th>
                  <th class="p-3">Aksi (Action)</th>
                  <th class="p-3">Detail Keterangan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-ink-100 dark:divide-ink-700/60">
                <tr v-for="log in logs" :key="log.id" class="hover:bg-paper-50/60 dark:hover:bg-ink-700/20 transition">
                  <td class="p-3 whitespace-nowrap text-ink-500 dark:text-ink-400">
                    {{ formatDate(log.created_at) }}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-paper-50 font-bold text-[10px]">
                      {{ log.username }}
                    </span>
                  </td>
                  <td class="p-3 whitespace-nowrap font-bold text-hazard-600 dark:text-hazard-400">
                    {{ log.action }}
                  </td>
                  <td class="p-3 text-ink-700 dark:text-ink-300">
                    {{ log.details }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Modal -->
        <div class="pt-4 border-t border-ink-100 dark:border-ink-700 flex justify-between items-center">
          <span class="text-[11px] font-mono text-ink-400">Menampilkan hingga 100 log terbaru.</span>
          <!-- Tombol Tutup Bawah -->
          <button @click="$emit('close')" class="px-4 py-2 bg-ink-900 dark:bg-ink-700 hover:bg-ink-700 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer">
            Tutup
          </button>
        </div>

      </div>
    </div>
  `,
};
