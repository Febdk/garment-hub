export default {
  name: "LogoModal",
  props: {
    show: { type: Boolean, required: true },
    buyers: { type: Array, required: true },
  },
  emits: ["close", "update-logo"],
  template: `
    <div v-if="show" class="fixed inset-0 bg-ink-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-ink-200 dark:border-ink-600 max-h-[85vh] flex flex-col">
        <div class="flex justify-between items-center pb-3 border-b border-ink-100 dark:border-ink-700">
          <h3 class="font-display text-base font-bold text-ink-900 dark:text-white">Kelola Format Logo Buyer</h3>
          <button type="button" @click="$emit('close')" class="text-ink-400 hover:text-ink-600 font-bold">✕</button>
        </div>

        <div class="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          <div
            v-for="b in buyers"
            :key="b.name"
            class="p-3 bg-paper-50 dark:bg-ink-700/50 rounded-xl border border-ink-200 dark:border-ink-600 flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-2.5">
              <img :src="b.logo" class="w-7 h-7 object-contain bg-white p-1 rounded border" @error="$event.target.style.display='none'" />
              <span class="text-xs font-data font-bold text-ink-800 dark:text-white">{{ b.name }}</span>
            </div>
            <button
              type="button"
              @click="$emit('update-logo', b)"
              class="text-xs bg-hazard-50 dark:bg-hazard-700/20 text-hazard-700 dark:text-hazard-300 hover:bg-hazard-100 px-2.5 py-1 rounded-lg font-data font-bold"
            >
              Update URL Logo
            </button>
          </div>
        </div>

        <button type="button" @click="$emit('close')" class="w-full bg-ink-900 dark:bg-ink-700 text-white py-2.5 rounded-xl text-sm font-data font-bold">
          Selesai
        </button>
      </div>
    </div>
  `,
};
