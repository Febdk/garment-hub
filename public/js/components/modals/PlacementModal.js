export default {
  name: "PlacementModal",
  props: {
    show: { type: Boolean, default: false },
    activePo: { type: Object, default: () => ({}) },
    activeColor: { type: Object, default: () => ({}) },
    placementForm: { type: Object, required: true },
  },
  emits: ["close", "save"],
  template: `
    <div
      v-if="show"
      class="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <!-- Backdrop Karbon Transparan -->
      <div
        class="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        @click="$emit('close')"
      ></div>

      <div
        class="relative bg-ink-800 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-ink-600 dark:border-gray-700 animate-fade-in-up"
      >
        <!-- Header -->
        <div class="bg-ink-900 dark:bg-gray-900 border-b border-ink-700 dark:border-gray-700 p-4 flex justify-between items-center">
          <h3 class="text-lg font-mono font-bold text-white flex items-center gap-2">
            <span class="bg-hazard-500/20 text-hazard-400 p-1.5 rounded-lg">📍</span>
            Update Lokasi Rak Warna
          </h3>
          <button @click="$emit('close')" class="text-ink-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        <!-- Body Form -->
        <div class="p-5 space-y-4 font-mono">
          <!-- Info Ringkas PO & Warna -->
          <div class="bg-ink-900/60 dark:bg-gray-900/50 p-3 rounded-xl border border-ink-700/60 text-xs space-y-1">
            <p class="text-ink-300">
              PO: <b class="text-white">{{ activePo.po_number }}</b> 
              <span v-if="activePo.buyer">({{ activePo.buyer }})</span>
            </p>
            <p class="text-ink-300">
              Kode Warna: <b class="text-indigo-400">COL {{ activeColor.color_code }}</b> 
              | Target: <b class="text-white">{{ activeColor.total_qty }} Karton</b>
            </p>
          </div>

          <!-- Murni Hanya Input Lokasi Rak -->
          <div>
            <label class="block text-xs font-bold text-ink-300 dark:text-gray-300 uppercase tracking-wider mb-2">
              Lokasi Rak / Floor (Contoh: F11, G5, Rak A1)
            </label>
            <input
              v-model="placementForm.rack_location"
              type="text"
              class="w-full bg-ink-900 dark:bg-gray-900 border border-ink-600 dark:border-gray-600 text-white text-base rounded-xl focus:ring-hazard-500 focus:border-hazard-500 block p-3 font-mono"
              placeholder="Masukkan alamat rak..."
              autofocus
            />
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="p-4 border-t border-ink-700 dark:border-gray-700 grid grid-cols-2 gap-3 bg-ink-800/80">
          <button
            type="button"
            @click="$emit('close')"
            class="min-h-[44px] px-4 py-2 bg-ink-700 hover:bg-ink-600 text-white font-mono font-medium rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            @click="$emit('save')"
            class="min-h-[44px] px-4 py-2 bg-hazard-500 hover:bg-hazard-600 text-ink-900 font-mono font-bold rounded-xl transition-colors shadow-sm"
          >
            Simpan Rak
          </button>
        </div>
      </div>
    </div>
  `,
};
