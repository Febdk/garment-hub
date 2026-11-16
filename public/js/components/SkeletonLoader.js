export default {
  name: "SkeletonLoader",
  template: `
    <div class="po-grid" aria-hidden="true">
      <div v-for="i in 4" :key="i" class="skeleton-card">
        <div class="skeleton-line skeleton-line--wide"></div>
        <div class="skeleton-line skeleton-line--medium"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    </div>
  `,
};
