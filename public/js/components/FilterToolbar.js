import { STATUS_OPTIONS } from "../constants.js";

export default {
  name: "FilterToolbar",
  props: {
    search: { type: String, required: true },
    buyer: { type: String, required: true },
    status: { type: String, required: true },
    buyers: { type: Array, required: true },
    showReset: { type: Boolean, required: true },
  },
  emits: ["update:search", "update:buyer", "update:status", "reset"],
  setup() {
    return { STATUS_OPTIONS };
  },
  template: `
    <div class="filter-toolbar bg-white dark:bg-ink-800 p-4 rounded-2xl border border-ink-200 dark:border-ink-600 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
      <div class="relative w-full md:w-80">
        <input
          type="text"
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          placeholder="Cari No. PO, Style, Warna, Inspector..."
          class="w-full pl-4 pr-4 py-2.5 text-sm bg-paper-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:bg-white dark:focus:bg-ink-700 focus:ring-2 focus:ring-hazard-500 focus:outline-none transition dark:text-white font-data"
        />
      </div>

      <div class="filter-controls flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-[11px] font-data font-bold text-ink-400 uppercase whitespace-nowrap">Buyer:</label>
          <select
            :value="buyer"
            @change="$emit('update:buyer', $event.target.value)"
            class="w-full sm:w-auto px-3 py-2 text-xs font-medium bg-paper-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:bg-white dark:focus:bg-ink-700 focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
          >
            <option value="">Semua Buyer ({{ buyers.length }})</option>
            <option v-for="b in buyers" :key="b.name" :value="b.name">{{ b.name }}</option>
          </select>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <label class="text-[11px] font-data font-bold text-ink-400 uppercase whitespace-nowrap">Status:</label>
          <select
            :value="status"
            @change="$emit('update:status', $event.target.value)"
            class="w-full sm:w-auto px-3 py-2 text-xs font-medium bg-paper-50 dark:bg-ink-700 border border-ink-200 dark:border-ink-600 rounded-xl focus:bg-white dark:focus:bg-ink-700 focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white"
          >
            <option value="">Semua Status</option>
            <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <button
          v-if="showReset"
          type="button"
          @click="$emit('reset')"
          class="filter-reset text-xs text-alarm-600 dark:text-alarm-300 font-data font-semibold hover:underline ml-auto"
        >
          Reset Filter
        </button>
      </div>
    </div>
  `,
};
