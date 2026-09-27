export default {
  name: "AdminForm",
  props: {
    buyers: { type: Array, required: true },
    form: { type: Object, required: true },
  },
  emits: ["submit"],
  setup(props, { emit }) {
    const { ref, watch } = Vue;
    const isSubmitting = ref(false);

    const addColorRow = () => {
      props.form.colors.push({ color_code: "", total_qty: "" });
    };

    const removeColorRow = (index) => {
      props.form.colors.splice(index, 1);
    };

    const handleSubmit = () => {
      isSubmitting.value = true;
      emit("submit");
    };

    // Otomatis menghentikan animasi loading ketika form berhasil disubmit dan di-reset oleh parent
    watch(
      () => props.form.po_number,
      (newVal) => {
        if (!newVal) {
          isSubmitting.value = false;
        }
      },
    );

    return { addColorRow, removeColorRow, isSubmitting, handleSubmit };
  },
  template: `
    <div class="bg-white dark:bg-ink-800 rounded-2xl shadow-sm border border-ink-200 dark:border-ink-600 p-6 h-fit space-y-4">
      <div class="border-b dark:border-ink-700 pb-3">
        <h2 class="font-display text-base font-bold text-ink-900 dark:text-white">
          Input Master PO &amp; Color Breakdown
        </h2>
        <p class="text-xs text-ink-400 font-data">Tambah pesanan PO baru beserta pembagian karton warna.</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3.5">
        <div>
          <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Pilih Buyer</label>
          <select
            v-model="form.buyer"
            required
            class="w-full px-3 py-2 text-sm bg-paper-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:bg-white dark:focus:bg-ink-700 focus:ring-2 focus:ring-hazard-500 focus:outline-none font-medium dark:text-white"
          >
            <option disabled value="">-- Pilih Buyer Resmi --</option>
            <option v-for="b in buyers" :key="b.name" :value="b.name">{{ b.name }}</option>
            <option value="CUSTOM">+ Input Buyer Custom...</option>
          </select>
        </div>

        <div v-if="form.buyer === 'CUSTOM'">
          <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Nama Buyer Custom</label>
          <input
            type="text"
            v-model="form.customBuyer"
            required
            placeholder="Masukkan nama buyer baru..."
            class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Nomor PO</label>
            <input
              type="text"
              v-model="form.po_number"
              required
              placeholder="Cth: 7105"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none font-data dark:text-white"
            />
          </div>
          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Style Code</label>
            <input
              type="text"
              v-model="form.style_code"
              required
              placeholder="Cth: Style-A99"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none font-data dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Ex-Fty Date (Shipment)</label>
          <input
            type="date"
            v-model="form.ex_fty_date"
            required
            class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
          />
        </div>

        <div class="border-t border-ink-100 dark:border-ink-700 pt-3">
          <div class="flex justify-between items-center mb-2">
            <label class="text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 uppercase">Breakdown Warna &amp; Target Karton</label>
            <button type="button" @click="addColorRow" class="text-xs bg-hazard-50 hover:bg-hazard-100 dark:bg-hazard-700/20 dark:hover:bg-hazard-700/30 text-hazard-700 dark:text-hazard-300 px-2.5 py-1 rounded-lg font-data font-bold transition">
              + Tambah Warna
            </button>
          </div>
          <div v-for="(col, index) in form.colors" :key="index" class="flex gap-2 mb-2 items-center">
            <input
              type="text"
              v-model="col.color_code"
              required
              placeholder="Kode Col (Cth: 507)"
              class="w-1/2 px-2.5 py-1.5 bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-lg text-xs font-data font-semibold dark:text-white"
            />
            <input
              type="number"
              v-model="col.total_qty"
              required
              placeholder="Qty Karton"
              class="w-1/3 px-2.5 py-1.5 bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-lg text-xs font-data dark:text-white"
            />
            <button type="button" @click="removeColorRow(index)" v-if="form.colors.length > 1" class="text-alarm-500 hover:text-alarm-700 font-bold text-xs p-1">
              ✕
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="w-full bg-hazard-500 hover:bg-hazard-600 disabled:opacity-50 text-ink-900 font-data font-bold py-2.5 rounded-xl text-sm transition shadow-sm mt-2 flex items-center justify-center gap-2"
        >
          <svg v-if="isSubmitting" class="animate-spin w-4 h-4 text-ink-900" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isSubmitting ? 'Menyimpan Master PO...' : 'Simpan Master PO' }}</span>
        </button>
      </form>
    </div>
  `,
};
