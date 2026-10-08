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
  emits: ["close", "open-carton-in", "open-carton-out", "open-placement"],
  setup(props, { emit }) {
    const movements = ref([]);
    const isLoading = ref(false);

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

    watch(
      () => props.isOpen,
      (newVal) => {
        if (newVal) {
          fetchMovements();
        } else {
          movements.value = [];
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
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black bg-opacity-60 transition-opacity" 
        @click="closeDrawer"
      ></div>

      <!-- Panel Drawer -->
      <div class="relative w-full md:w-[420px] bg-gray-900 h-full overflow-y-auto shadow-2xl flex flex-col border-l border-gray-700 animate-slide-in-right pb-10">
        
        <!-- Header -->
        <div class="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
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
              <p class="flex items-start">
                <span class="text-gray-400 inline-block w-20 shrink-0">Shipment</span> : 
                <span class="ml-1">
                    <!-- Jika ada tanggal revisi dadakan -->
                    <template v-if="po.revised_ex_fty_date">
                    <span class="text-gray-500 line-through text-xs mr-2">
                        {{ formatDate(po.ex_fty_date).split(',')[0] }}
                    </span>
                    <span class="font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
                        ⚠️ {{ formatDate(po.revised_ex_fty_date).split(',')[0] }}
                        <span class="text-[9px] bg-red-500 text-white px-1 rounded font-mono">REVISI</span>
                    </span>
                    </template>

                    <!-- Jika tanggal normal -->
                    <template v-else>
                    <span class="font-medium text-red-400">
                        {{ formatDate(po.ex_fty_date).split(',')[0] }}
                    </span>
                    </template>
                </span>
                </p>
            </div>
          </div>

          <!-- 2. Global Karton (Tanpa Status "Di Rak") -->
          <div class="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h3 class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Global Karton (Semua Warna)</h3>
            <div class="grid grid-cols-2 gap-3 text-center">
              <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                <p class="text-[10px] text-gray-400 uppercase mb-1">Masuk</p>
                <p class="text-2xl font-bold text-green-400">{{ po.qty_in || 0 }}</p>
              </div>
              <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                <p class="text-[10px] text-gray-400 uppercase mb-1">Keluar</p>
                <p class="text-2xl font-bold text-red-400">{{ po.qty_out || 0 }}</p>
              </div>
            </div>
            
            <!-- Tombol Aksi Cepat Tracking -->
            <div class="grid grid-cols-2 gap-3 mt-4">
              <button @click="$emit('open-carton-in', po)" class="min-h-[44px] bg-green-600/20 hover:bg-green-600 border border-green-600/50 text-green-400 hover:text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center">
                + Karton Masuk
              </button>
              <button @click="$emit('open-carton-out', po)" class="min-h-[44px] bg-red-600/20 hover:bg-red-600 border border-red-600/50 text-red-400 hover:text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center">
                - Karton Keluar
              </button>
            </div>
          </div>

          <!-- 3. Breakdown Warna & Setting Rak -->
          <div>
            <h3 class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center">
              Detail Warna &amp; Rak
            </h3>
            <div class="space-y-3">
              <div
                v-for="color in po.colors"
                :key="color.id"
                class="bg-gray-800 p-3 rounded-lg border border-gray-700"
              >
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="font-mono font-bold text-indigo-400 bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-700">COL: {{ color.color_code }}</span>
                  <span class="text-[11px] font-mono text-gray-400">Target: <b class="text-white">{{ color.total_qty }}</b> Ktn</span>
                </div>

                <div class="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="color.carton_qty >= color.total_qty ? 'bg-green-500' : 'bg-yellow-500'"
                    :style="{ width: Math.min(100, Math.round(((color.carton_qty || 0) / (color.total_qty || 1)) * 100)) + '%' }"
                  ></div>
                </div>

                <div class="flex justify-between items-end">
                  <div class="text-[11px] text-gray-400 font-mono space-y-0.5">
                    <p>Rak: <b class="text-white font-bold">{{ color.rack_location || 'BELUM SET' }}</b></p>
                    <p>Fisik: <b class="text-white font-bold">{{ color.carton_qty || 0 }} Ktn</b></p>
                  </div>
                  <button
                    type="button"
                    @click="$emit('open-placement', po, color)"
                    class="bg-yellow-500/20 hover:bg-yellow-500 border border-yellow-500/50 text-yellow-500 hover:text-gray-900 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1"
                  >
                    Set Rak
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Riwayat Timeline -->
          <div>
            <h3 class="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
              Riwayat Aktivitas
            </h3>
            
            <div v-if="isLoading" class="text-gray-400 text-sm text-center py-4">Memuat data...</div>
            <div v-else-if="movements.length === 0" class="bg-gray-800/50 rounded-lg border border-dashed border-gray-700 p-4 text-center">
              <p class="text-gray-500 text-sm italic">Belum ada aktivitas.</p>
            </div>
            
            <div v-else class="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:translate-x-px before:h-full before:w-0.5 before:bg-gray-700">
              <div v-for="m in movements" :key="m.id" class="relative flex items-center gap-3">
                
                <div :class="m.type === 'IN' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'" class="flex items-center justify-center w-5 h-5 rounded-full border shrink-0 z-10">
                  <svg v-if="m.type === 'IN'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                  <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                </div>
                
                <div class="flex-1 p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-xs">
                  <div class="flex items-center justify-between mb-0.5">
                    <span class="font-bold" :class="m.type === 'IN' ? 'text-green-400' : 'text-red-400'">
                      {{ m.type === 'IN' ? '+' : '-' }}{{ m.quantity }} CTN
                    </span>
                    <span class="text-[10px] text-gray-500">{{ formatDate(m.recorded_at).split(',')[1] }}</span>
                  </div>
                  <p class="text-gray-300 font-medium">{{ m.reason }}</p>
                  <p v-if="m.notes" class="text-gray-500 italic mt-1">"{{ m.notes }}"</p>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
};
