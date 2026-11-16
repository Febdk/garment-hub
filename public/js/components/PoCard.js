import { getBuyerBadgeClass, getStatusBadge, isUrgentPO } from "../utils.js";

export default {
  name: "PoCard",
  props: {
    po: { type: Object, required: true },
  },
  emits: ["open-drawer"],
  setup() {
    const formatDateOnly = (val) => {
      if (!val) return "-";
      return val.split("T")[0];
    };

    const getGlobalRack = (po) => {
      if (!po.colors || po.colors.length === 0) return "BELUM SET";
      const racks = po.colors
        .map((c) => c.rack_location)
        .filter(
          (r) => r && r.trim() !== "" && r.trim().toUpperCase() !== "BELUM SET",
        );
      if (racks.length === 0) return "BELUM SET";
      return [...new Set(racks)].join(", ");
    };

    return { getBuyerBadgeClass, getStatusBadge, isUrgentPO, getGlobalRack, formatDateOnly };
  },
  template: `
    <article
      class="po-card"
      :class="{ 'po-card--urgent': isUrgentPO(po) }"
      @click="$emit('open-drawer', po)"
      @keydown.enter="$emit('open-drawer', po)"
      @keydown.space.prevent="$emit('open-drawer', po)"
      tabindex="0"
      role="button"
      :aria-label="'Detail PO ' + po.po_number + ', ' + po.buyer"
    >
      <div class="po-card__top">
        <div class="po-card__identity">
          <div class="po-card__buyer-line">
            <img v-if="po.buyer_logo" :src="po.buyer_logo" :alt="po.buyer" class="po-card__logo" @error="$event.target.style.display='none'" />
            <span :class="getBuyerBadgeClass(po.buyer)" class="text-[10px] font-mono font-bold">{{ po.buyer }}</span>
          </div>
          <h3 class="po-card__number">{{ po.po_number }}</h3>
          <p class="po-card__style">Style <strong>{{ po.style_code }}</strong></p>
        </div>
        <span :class="getStatusBadge(po.status)" class="po-card__status">{{ po.status }}</span>
      </div>

      <div class="po-card__facts">
        <div class="po-card__fact">
          <span class="po-card__label">Ex-Fty / Shipment</span>
          <span v-if="po.revised_ex_fty_date" class="po-card__date-revised">
            <s>{{ formatDateOnly(po.ex_fty_date) }}</s>
            <strong>{{ formatDateOnly(po.revised_ex_fty_date) }}</strong>
          </span>
          <strong v-else class="po-card__value">{{ formatDateOnly(po.ex_fty_date) }}</strong>
        </div>
        <div class="po-card__fact">
          <span class="po-card__label">Breakdown warna</span>
          <strong class="po-card__value">{{ po.colors ? po.colors.length : 0 }} <span>warna</span></strong>
        </div>
        <div class="po-card__fact">
          <span class="po-card__label">Target karton</span>
          <strong class="po-card__value">{{ po.colors ? po.colors.reduce((sum, c) => sum + (Number(c.total_qty) || 0), 0) : 0 }} <span>karton</span></strong>
        </div>
      </div>

      <div class="po-card__rack">
        <span class="po-card__label">Lokasi rak</span>
        <strong :class="{ 'po-card__rack--unset': getGlobalRack(po) === 'BELUM SET' }">{{ getGlobalRack(po) }}</strong>
      </div>

      <div class="po-card__footer">
        <span>{{ isUrgentPO(po) ? 'Perlu perhatian' : 'Detail PO & tracking' }}</span>
        <span aria-hidden="true">→</span>
      </div>
    </article>
  `,
};
