import { getPoMovements } from "../../api.js";

const { ref, watch } = Vue;

export default {
  name: "PoDetailDrawer",
  props: {
    po: {
      type: Object,
      default: null,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close", "open-carton-in", "open-carton-out"],
  setup(props, { emit }) {
    const movements = ref([]);
    const isLoading = ref(false);

    // Fetch riwayat pergerakan karton setiap kali drawer dibuka
    const fetchMovements = async () => {
      if (!props.po || !props.po.id) return;

      isLoading.value = true;
      try {
        const res = await getPoMovements(props.po.id);
        if (res.ok) {
          movements.value = await res.json();
        }
      } catch (e) {
        console.error("Gagal mengambil riwayat karton:", e);
      } finally {
        isLoading.value = false;
      }
    };

    // Pantau jika props.isOpen berubah menjadi true
    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          fetchMovements();
        } else {
          movements.value = []; // Reset saat ditutup
        }
      },
    );

    const closeDrawer = () => {
      emit("close");
    };

    const formatDate = (val) => {
      if (!val) return "-";
      return new Date(val).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return {
      movements,
      isLoading,
      closeDrawer,
      formatDate,
    };
  },
  template: `
    <div v-if="isOpen && po" class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop / Background Gelap -->
      <div 
        class="absolute inset-0 bg-black bg-opacity-60 transition-opacity" 
        @click="closeDrawer"
      ></div>

      <!-- Panel Drawer (Slide in dari kanan) -->
      <div class="relative w-full md:w-[420px] bg-gray-900 h-full overflow-y-auto shadow-2xl flex flex-col border-l border-gray-700 animate-slide-in-right">
        
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <h2 class="text-lg font-bold text-white tracking-wider uppercase truncate pr-4">
            <span class="text-yellow-400">PO:</span> {{ po.po_number }}
          </h2>
          <button @click="closeDrawer" class="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Content Area -->
        <div class="p-4 flex-1 space-y-6">
          
          <!-- 1. Ringkasan PO -->
          <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Ringkasan</h3>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-700 text-yellow-400 border border-yellow-500/30">
                  {{ po.status }}
                </span>
            </div>
            <div class="space-y-1.5 text-sm text-gray-200">
              <p><span class="text-gray-400 inline-block w-20">Style</span> : <span class="font-medium">{{ po.style_code }}</span></p>
              <p><span class="text-gray-400 inline-block w-20">Buyer</span> : <span class="font-medium">{{ po.buyer }}</span></p>
              <p><span class="text-gray-400 inline-block w-20">Shipment</span> : <span class="font-medium text-red-400">{{ formatDate(po.ex_fty_date).split(',')[0] }}</span></p>
            </div>
          </div>

          <!-- 2. Tracking Karton -->
          <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Tracking Karton</h3>
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50">
                <p class="text-[10px] text-gray-400 uppercase mb-1">Masuk</p>
                <p class="text-xl font-bold text-green-400">{{ po.qty_in || 0 }}</p>
              </div>
              <div class="bg-gray-900/50 p-2 rounded-lg border border-gray-700/50">
                <p class="text-[10px] text-gray-400 uppercase mb-1">Keluar</p>
                <p class="text-xl font-bold text-red-400">{{ po.qty_out || 0 }}</p>
              </div>
              <div class="bg-gray-900 p-2 rounded-lg border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                <p class="text-[10px] text-yellow-400 uppercase mb-1">Di Rak</p>
                <p class="text-xl font-bold text-white">{{ (po.qty_in || 0) - (po.qty_out || 0) }}</p>
              </div>
            </div>
          </div>

          <!-- 3. Tombol Aksi Cepat (Mobile Friendly min-h 44px) -->
          <div class="grid grid-cols-2 gap-3">
            <button @click="$emit('open-carton-in', po)" class="min-h-[48px] bg-green-600/20 hover:bg-green-600 border border-green-600/50 text-green-400 hover:text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center">
              + Karton Masuk
            </button>
            <button @click="$emit('open-carton-out', po)" class="min-h-[48px] bg-red-600/20 hover:bg-red-600 border border-red-600/50 text-red-400 hover:text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center">
              - Karton Keluar
            </button>
          </div>

          <!-- 4. Riwayat Timeline -->
          <div>
            <h3 class="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider flex items-center">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Riwayat Aktivitas
            </h3>
            
            <div v-if="isLoading" class="text-gray-400 text-sm text-center py-6 flex flex-col items-center">
               <svg class="animate-spin h-5 w-5 text-yellow-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               Memuat data...
            </div>
            
            <div v-else-if="movements.length === 0" class="bg-gray-800/50 rounded-lg border border-dashed border-gray-700 p-6 text-center">
              <p class="text-gray-500 text-sm italic">Belum ada riwayat pergerakan karton.</p>
            </div>
            
            <div v-else class="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">
              <div v-for="m in movements" :key="m.id" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                <!-- Timeline Icon -->
                <div :class="m.type === 'IN' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'" class="flex items-center justify-center w-6 h-6 rounded-full border shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <svg v-if="m.type === 'IN'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                  <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                </div>
                
                <!-- Timeline Content -->
                <div class="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-bold text-sm" :class="m.type === 'IN' ? 'text-green-400' : 'text-red-400'">
                      {{ m.type === 'IN' ? '+' : '-' }}{{ m.quantity }} CTN
                    </span>
                    <span class="text-[10px] text-gray-500">{{ formatDate(m.recorded_at).split(',')[1] }}</span>
                  </div>
                  <p class="text-gray-300 text-xs font-medium">{{ m.reason }}</p>
                  <p class="text-gray-500 text-[10px] mt-1">{{ formatDate(m.recorded_at).split(',')[0] }} • {{ m.recorded_by_name || 'System' }}</p>
                  <p v-if="m.notes" class="text-gray-400 text-xs italic mt-2 border-l-2 border-gray-600 pl-2">"{{ m.notes }}"</p>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
};
