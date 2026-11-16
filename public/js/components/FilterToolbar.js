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
  setup() {
    return { STATUS_OPTIONS };
  },
  template: `
    <section class="filter-toolbar" aria-label="Filter purchase order">
      <label class="search-field">
        <span class="sr-only">Cari purchase order</span>
        <svg class="search-field__icon" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
        </svg>
        <input
          type="search"
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          placeholder="Cari PO, style, warna, atau inspector"
          autocomplete="off"
        />
      </label>

      <div class="filter-controls">
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
          Reset
        </button>
      </div>
    </section>
  `,
};
