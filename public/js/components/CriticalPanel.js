import {
  formatDateTime,
  getStatusBadge,
  getUrgencyBadgeText,
} from "../utils.js";

export default {
  name: "CriticalPanel",
  props: {
    criticalPos: { type: Array, required: true },
    filterUrgentOnly: { type: Boolean, required: true },
  },
  emits: ["toggle-urgent", "open-drawer"],
  setup() {
    return { formatDateTime, getStatusBadge, getUrgencyBadgeText };
  },
  template: `
    <section
      v-if="criticalPos.length > 0"
      class="critical-panel urgent-panel"
      aria-labelledby="urgent-title"
    >
      <div class="urgent-panel__head">
        <div class="urgent-panel__title-wrap">
          <span class="urgent-panel__icon" aria-hidden="true">!</span>
          <div>
            <h3 id="urgent-title" class="urgent-panel__title">Perlu perhatian</h3>
            <p class="urgent-panel__subtitle">{{ criticalPos.length }} PO mendekati shipment atau dalam inspeksi</p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('toggle-urgent')"
          class="urgent-panel__filter"
          :class="{ 'is-active': filterUrgentOnly }"
          :aria-pressed="filterUrgentOnly"
        >
          {{ filterUrgentOnly ? 'Tampilkan semua' : 'Filter urgent' }}
        </button>
      </div>

      <ul class="urgent-list">
        <li v-for="cpo in criticalPos" :key="'crit-' + cpo.id">
          <button type="button" class="urgent-item" @click="$emit('open-drawer', cpo)">
            <span class="urgent-item__main">
              <strong>{{ cpo.po_number }}</strong>
              <span>{{ cpo.style_code }}</span>
            </span>
            <span class="urgent-item__meta">
              <span :class="getStatusBadge(cpo.status)" class="urgent-item__status">{{ cpo.status }}</span>
              <span class="urgent-item__urgency">{{ getUrgencyBadgeText(cpo) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  `,
};
