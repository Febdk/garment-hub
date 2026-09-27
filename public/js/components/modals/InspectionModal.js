export default {
  name: "InspectionModal",
  props: {
    show: { type: Boolean, required: true },
    inspectionForm: { type: Object, required: true },
  },
  emits: ["close", "submit"],
  template: `
    <div v-if="show" class="fixed inset-0 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-ink-200 dark:border-ink-600">
        <div class="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-ink-700">
          <h3 class="font-display text-base font-bold text-ink-900 dark:text-white">
            Input Log {{ inspectionForm.targetStatus }}
          </h3>
          <button type="button" @click="$emit('close')" class="text-ink-400 hover:text-ink-600 font-bold">✕</button>
        </div>

        <form @submit.prevent="$emit('submit')" class="space-y-4 mt-4">
          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Nama Inspector / Person-in-Charge</label>
            <input
              type="text"
              v-model="inspectionForm.inspector_name"
              required
              placeholder="Cth: Budi (QC Internal) / Alex (Intertek)"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
            />
          </div>

          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Tanggal &amp; Waktu Inspeksi</label>
            <input
              type="datetime-local"
              v-model="inspectionForm.inspection_datetime"
              required
              class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
            />
          </div>

          <div class="flex space-x-3 pt-2">
            <button type="button" @click="$emit('close')" class="w-1/2 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 text-ink-700 dark:text-ink-300 py-2.5 rounded-xl text-sm font-data font-bold transition">
              Batal
            </button>
            <button type="submit" class="w-1/2 bg-hazard-500 hover:bg-hazard-600 text-ink-900 py-2.5 rounded-xl text-sm font-data font-bold transition shadow-sm">
              Simpan Log Inspeksi
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
};
