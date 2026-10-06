import { recordCartonIn } from "../../api.js";

const { ref, watch } = Vue;

export default {
  name: "CartonInModal",
  props: {
    po: { type: Object, default: null },
    isOpen: { type: Boolean, default: false },
  },
  emits: ["close", "success"],
  setup(props, { emit }) {
    const quantity = ref("");
    const notes = ref("");
    const isSubmitting = ref(false);

    // Reset form setiap kali modal dibuka
    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          quantity.value = "";
          notes.value = "";
        }
      },
    );

    const handleSubmit = async () => {
      if (!quantity.value || quantity.value <= 0) {
        alert("Jumlah karton harus diisi dan lebih dari 0!");
        return;
      }

      isSubmitting.value = true;
      try {
        const payload = {
          po_id: props.po.id,
          quantity: parseInt(quantity.value),
          notes: notes.value,
        };

        const res = await recordCartonIn(payload);
        if (res.ok) {
          emit("success"); // Memicu refresh data di komponen induk (app.js)
          emit("close");
        } else {
          const err = await res.json();
          alert("Gagal: " + (err.error || "Terjadi kesalahan saat menyimpan"));
        }
      } catch (e) {
        console.error("Error submit carton in:", e);
        alert("Terjadi kesalahan koneksi server.");
      } finally {
        isSubmitting.value = false;
      }
    };

    return { quantity, notes, isSubmitting, handleSubmit };
  },
  template: `
    <div v-if="isOpen && po" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" @click="$emit('close')"></div>
      
      <div class="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-700 animate-fade-in-up">
        
        <!-- Header -->
        <div class="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white flex items-center">
            <span class="bg-green-500/20 text-green-400 p-1.5 rounded-lg mr-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
            </span>
            Karton Masuk
          </h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4">
          <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700 text-sm">
            <p class="text-gray-400">PO: <span class="text-white font-bold">{{ po.po_number }}</span></p>
            <p class="text-gray-400">Style: <span class="text-white">{{ po.style_code }}</span></p>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Qty Masuk (Karton)</label>
            <input 
              v-model="quantity" 
              type="number" 
              min="1"
              class="w-full bg-gray-900 border border-gray-600 text-white text-lg rounded-xl focus:ring-green-500 focus:border-green-500 block p-3 min-h-[48px]" 
              placeholder="Contoh: 50"
            >
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Catatan / Rak (Opsional)</label>
            <textarea 
              v-model="notes" 
              rows="2"
              class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block p-3" 
              placeholder="Misal: Rak A-02, kondisi baik..."
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-700 grid grid-cols-2 gap-3 bg-gray-800/80">
          <button @click="$emit('close')" class="min-h-[48px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
            Batal
          </button>
          <button @click="handleSubmit" :disabled="isSubmitting" class="min-h-[48px] px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50">
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Simpan
          </button>
        </div>
      </div>
    </div>
  `,
};
