import { STATUS_OPTIONS } from "../constants.js";

export default {
  name: "FilterToolbar",
  props: {
    search: { type: String, required: true },
    buyer: { type: String, required: true },
    status: { type: String, required: true },
    date: { type: String, default: "" },
    buyers: { type: Array, required: true },
    showReset: { type: Boolean, required: true },
  },
  emits: [
    "update:search",
    "update:buyer",
    "update:status",
    "update:date",
    "reset",
  ],
  setup(props) {
    const { ref, computed } = Vue;
    const isFilterExpanded = ref(false);

    const activeFilterCount = computed(() => {
      let count = 0;
      if (props.buyer) count++;
      if (props.status) count++;
      if (props.date) count++;
      return count;
    });

    const isFiltersVisible = computed(() => {
      return isFilterExpanded.value || activeFilterCount.value > 0;
    });

    return {
      STATUS_OPTIONS,
      isFilterExpanded,
      activeFilterCount,
      isFiltersVisible,
    };
  },
  template: `
    <section class="filter-toolbar" aria-label="Filter purchase order">
      <!-- Search Input & Mobile Filter Toggle -->
      <div class="flex items-center gap-2 w-full">
        <label class="search-field flex-1">
          <span class="sr-only">Cari purchase order</span>
          <svg class="search-field__icon" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
          </svg>
          <input
            type="search"
            :value="search"
            @input="$emit('update:search', $event.target.value)"
            placeholder="Cari PO, style, warna, rak..."
            autocomplete="off"
          />
        </label>

        <!-- Tombol Buka/Tutup Filter Khusus di HP -->
        <button
          type="button"
          @click="isFilterExpanded = !isFilterExpanded"
          class="md:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 text-xs font-semibold shrink-0 min-h-[44px]"
          :class="{ 'border-hazard-500 text-hazard-600 dark:text-hazard-400 font-bold': activeFilterCount > 0 }"
          aria-label="Filter lanjutan"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filter</span>
          <span v-if="activeFilterCount > 0" class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-hazard-500 text-white text-[10px] font-bold">
            {{ activeFilterCount }}
          </span>
        </button>
      </div>

      <!-- Filter Controls: Default terlihat di desktop, di HP hanya tampil jika di-expand atau ada filter aktif -->
      <div
        class="filter-controls"
        :class="[ isFiltersVisible ? 'grid' : 'hidden md:grid' ]"
      >
        <label class="filter-field">
          <span>Buyer</span>
          <select :value="buyer" @change="$emit('update:buyer', $event.target.value)">
            <option value="">Semua buyer ({{ buyers.length }})</option>
            <option v-for="b in buyers" :key="b.name" :value="b.name">{{ b.name }}</option>
          </select>
        </label>

        <label class="filter-field">
          <span>Status</span>
          <select :value="status" @change="$emit('update:status', $event.target.value)">
            <option value="">Semua status</option>
            <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="filter-field">
          <span>Shipment</span>
          <input type="date" :value="date" @input="$emit('update:date', $event.target.value)" />
        </label>

        <button v-if="showReset" type="button" @click="$emit('reset')" class="filter-reset">
          Reset filter
        </button>
      </div>
    </section>
  `,
};
