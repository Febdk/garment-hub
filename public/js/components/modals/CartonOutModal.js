import { recordCartonOut } from "../../api.js";

const { ref, watch, computed } = Vue;

export default {
  name: "CartonOutModal",
  props: {
    po: { type: Object, default: null },
    isOpen: { type: Boolean, default: false },
  },
  emits: ["close", "success"],
  setup(props, { emit }) {
    const quantity = ref("");
    const reason = ref("Inspeksi");
    const notes = ref("");
    const isSubmitting = ref(false);

    // Hitung sisa stok di rak secara reaktif
    const sisaDiRak = computed(() => {
      if (!props.po) return 0;
      return (props.po.qty_in || 0) - (props.po.qty_out || 0);
    });

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          quantity.value = "";
          reason.value = "Inspeksi";
          notes.value = "";
        }
      },
    );

    const handleSubmit = async () => {
      const inputQty = parseInt(quantity.value);

      if (!inputQty || inputQty <= 0) {
        alert("Jumlah karton harus diisi dan lebih dari 0!");
        return;
      }

      if (inputQty > sisaDiRak.value) {
        alert(
          `Gagal: Jumlah keluar (${inputQty}) melebihi sisa di rak (${sisaDiRak.value})!`,
        );
        return;
      }

      isSubmitting.value = true;
      try {
        const payload = {
          po_id: props.po.id,
          quantity: inputQty,
          reason: reason.value,
          notes: notes.value,
        };

        const res = await recordCartonOut(payload);
        if (res.ok) {
          emit("success");
          emit("close");
        } else {
          const err = await res.json();
          alert("Gagal: " + (err.error || "Terjadi kesalahan saat menyimpan"));
        }
      } catch (e) {
        console.error("Error submit carton out:", e);
        alert("Terjadi kesalahan koneksi server.");
      } finally {
        isSubmitting.value = false;
      }
    };

    return { quantity, reason, notes, isSubmitting, sisaDiRak, handleSubmit };
  },
  template: `
    <div v-if="isOpen && po" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm" @click="$emit('close')"></div>
      
      <div class="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-700 animate-fade-in-up">
        
        <!-- Header -->
        <div class="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
          <h3 class="text-lg font-bold text-white flex items-center">
            <span class="bg-red-500/20 text-red-400 p-1.5 rounded-lg mr-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path></svg>
            </span>
            Karton Keluar
          </h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-white p-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4">
          
          <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
            <div>
              <p class="text-gray-400 text-xs">PO Number</p>
              <p class="text-white font-bold text-sm">{{ po.po_number }}</p>
            </div>
            <div class="text-right">
              <p class="text-gray-400 text-xs">Sisa di Rak</p>
              <p class="text-yellow-400 font-bold text-lg">{{ sisaDiRak }} <span class="text-xs font-normal">CTN</span></p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Qty Keluar (Karton)</label>
            <input 
              v-model="quantity" 
              type="number" 
              min="1"
              :max="sisaDiRak"
              class="w-full bg-gray-900 border border-gray-600 text-white text-lg rounded-xl focus:ring-red-500 focus:border-red-500 block p-3 min-h-[48px]" 
              placeholder="Contoh: 2"
            >
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alasan</label>
            <select 
              v-model="reason" 
              class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-xl focus:ring-red-500 focus:border-red-500 block p-3 min-h-[48px]"
            >
              <option value="Inspeksi">Inspeksi (QIMA/Internal)</option>
              <option value="Bongkar">Bongkar / Cek Fisik</option>
              <option value="Pengambilan">Pengambilan Sample</option>
              <option value="Shipment">Shipment (Muat Kontainer)</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Keterangan (Opsional)</label>
            <textarea 
              v-model="notes" 
              rows="2"
              class="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-xl focus:ring-red-500 focus:border-red-500 block p-3" 
              placeholder="Catatan tambahan..."
            ></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-gray-700 grid grid-cols-2 gap-3 bg-gray-800/80">
          <button @click="$emit('close')" class="min-h-[48px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors">
            Batal
          </button>
          <button @click="handleSubmit" :disabled="isSubmitting || sisaDiRak === 0" class="min-h-[48px] px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50">
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Simpan
          </button>
        </div>
      </div>
    </div>
  `,
};
