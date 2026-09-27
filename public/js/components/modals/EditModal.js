export default {
  name: "EditModal",
  props: {
    show: { type: Boolean, required: true },
    buyers: { type: Array, required: true },
    // Objek reaktif yang sama dengan yang dipegang root — mutasi langsung di sini tersinkron otomatis.
    editForm: { type: Object, required: true },
  },
  emits: ["close", "save"],
  setup(props) {
    const addEditColorRow = () => {
      props.editForm.colors.push({
        color_code: "",
        total_qty: "",
        carton_qty: 0,
        rack_location: "",
        helper_name: "",
      });
    };
    const removeEditColorRow = (index) => {
      props.editForm.colors.splice(index, 1);
    };
    return { addEditColorRow, removeEditColorRow };
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-ink-200 dark:border-ink-600 my-8">
        <div class="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-ink-700">
          <h3 class="font-display text-base font-bold text-ink-900 dark:text-white">
            Edit Master PO {{ editForm.po_number }}
          </h3>
          <button type="button" @click="$emit('close')" class="text-ink-400 hover:text-ink-600 font-bold">✕</button>
        </div>

        <form @submit.prevent="$emit('save')" class="space-y-4 mt-4">
          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Buyer</label>
            <select
              v-model="editForm.buyer"
              required
              class="w-full px-3 py-2 text-sm bg-paper-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:bg-white dark:focus:bg-ink-700 focus:ring-2 focus:ring-hazard-500 focus:outline-none font-medium dark:text-white"
            >
              <option v-for="b in buyers" :key="b.name" :value="b.name">{{ b.name }}</option>
              <option value="CUSTOM">+ Input Buyer Custom...</option>
            </select>
          </div>

          <div v-if="editForm.buyer === 'CUSTOM'">
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Nama Buyer Custom</label>
            <input
              type="text"
              v-model="editForm.customBuyer"
              required
              class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Nomor PO</label>
              <input
                type="text"
                v-model="editForm.po_number"
                required
                class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none font-data font-semibold dark:text-white"
              />
            </div>
            <div>
              <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Style Code</label>
              <input
                type="text"
                v-model="editForm.style_code"
                required
                class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none font-data font-semibold dark:text-white"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Ex-Fty Date (Awal)</label>
              <input
                type="date"
                v-model="editForm.ex_fty_date"
                required
                class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label class="block text-[11px] font-data font-bold text-hazard-600 dark:text-hazard-400 mb-1 uppercase">Shipment Dadakan (Revisi)</label>
              <input
                type="date"
                v-model="editForm.revised_ex_fty_date"
                class="w-full px-3 py-2 text-sm bg-hazard-50 dark:bg-hazard-700/10 border border-hazard-300 dark:border-hazard-700 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-hazard-200"
              />
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 mb-1 uppercase">Catatan Shipment Dadakan</label>
            <input
              type="text"
              v-model="editForm.shipment_note"
              placeholder="Cth: Ditarik maju oleh Buyer / Kapal dimajukan"
              class="w-full px-3 py-2 text-sm bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
            />
          </div>

          <div class="border-t border-ink-100 dark:border-ink-700 pt-3 space-y-2">
            <div class="flex justify-between items-center">
              <label class="text-[11px] font-data font-bold text-ink-500 dark:text-ink-300 uppercase">Breakdown Warna &amp; Target Karton</label>
              <button type="button" @click="addEditColorRow" class="text-xs bg-hazard-50 dark:bg-hazard-700/20 text-hazard-700 dark:text-hazard-300 px-2.5 py-1 rounded-lg font-data font-bold transition">
                + Tambah Warna
              </button>
            </div>
            <div
              v-for="(col, index) in editForm.colors"
              :key="index"
              class="flex gap-2 items-center bg-paper-50 dark:bg-ink-700 p-2 rounded-xl border border-ink-200 dark:border-ink-600"
            >
              <input
                type="text"
                v-model="col.color_code"
                required
                placeholder="Kode Warna"
                class="w-1/2 px-2.5 py-1.5 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-600 rounded-lg text-xs font-data font-semibold dark:text-white"
              />
              <input
                type="number"
                v-model="col.total_qty"
                required
                placeholder="Target Karton"
                class="w-1/3 px-2.5 py-1.5 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-600 rounded-lg text-xs font-data dark:text-white"
              />
              <button type="button" @click="removeEditColorRow(index)" v-if="editForm.colors.length > 1" class="text-alarm-500 hover:text-alarm-700 font-bold text-xs p-1">
                ✕
              </button>
            </div>
          </div>

          <div class="flex space-x-3 pt-3">
            <button type="button" @click="$emit('close')" class="w-1/2 bg-ink-100 dark:bg-ink-700 hover:bg-ink-200 text-ink-700 dark:text-ink-300 py-2.5 rounded-xl text-sm font-data font-bold transition">
              Batal
            </button>
            <button type="submit" class="w-1/2 bg-hazard-500 hover:bg-hazard-600 text-ink-900 py-2.5 rounded-xl text-sm font-data font-bold transition shadow-sm">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
};
