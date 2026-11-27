export default {
  name: "StatsCards",
  props: {
    stats: { type: Object, required: true },
    criticalCount: { type: Number, required: true },
  },
  emits: ["toggle-urgent"],
  template: `
    <section class="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Ringkasan operasional">
      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--blue" aria-hidden="true">PO</div>
        <div class="metric-card__content">
          <p class="metric-card__label">Total purchase order</p>
          <strong class="metric-card__value">{{ stats.total_po || 0 }}</strong>
          <span class="metric-card__hint">Master PO tercatat</span>
        </div>
      </article>

      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--indigo" aria-hidden="true">CT</div>
        <div class="metric-card__content">
          <p class="metric-card__label">Karton tercatat</p>
          <strong class="metric-card__value">{{ stats.total_actual_cartons || 0 }}</strong>
          <span class="metric-card__hint">dari {{ stats.total_target_cartons || 0 }} target</span>
        </div>
      </article>

      <article class="metric-card">
        <div class="metric-card__icon metric-card__icon--green" aria-hidden="true">RT</div>
        <div class="metric-card__content">
          <p class="metric-card__label">Ready to ship</p>
          <strong class="metric-card__value metric-card__value--green">{{ stats.ready_to_ship || 0 }}</strong>
          <span class="metric-card__hint">PO siap dikirim</span>
        </div>
      </article>

      <button type="button" @click="$emit('toggle-urgent')" class="metric-card metric-card--urgent" :aria-label="'Tampilkan ' + criticalCount + ' PO urgent'">
        <div class="metric-card__icon metric-card__icon--red" aria-hidden="true">!</div>
        <div class="metric-card__content">
          <p class="metric-card__label metric-card__label--red">Perlu perhatian</p>
          <strong class="metric-card__value metric-card__value--red">{{ criticalCount }}</strong>
          <span class="metric-card__hint">H-2 / proses inspeksi</span>
        </div>
      </button>
    </section>
  `,
};
