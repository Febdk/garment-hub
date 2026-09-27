export default {
  name: "SkeletonLoader",
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
      <div v-for="i in 4" :key="i" class="bg-white dark:bg-ink-800 p-5 rounded-2xl border border-ink-200 dark:border-ink-700 shadow-sm animate-pulse space-y-4">
        <div class="flex justify-between items-center">
          <div class="h-5 bg-ink-200 dark:bg-ink-700 rounded-lg w-1/3"></div>
          <div class="h-6 bg-ink-200 dark:bg-ink-700 rounded-lg w-1/4"></div>
        </div>
        <div class="space-y-2">
          <div class="h-4 bg-ink-200 dark:bg-ink-700 rounded-md w-3/4"></div>
          <div class="h-4 bg-ink-200 dark:bg-ink-700 rounded-md w-1/2"></div>
        </div>
        <div class="pt-4 border-t border-ink-100 dark:border-ink-700 flex justify-between items-center">
          <div class="h-8 bg-ink-200 dark:bg-ink-700 rounded-xl w-1/3"></div>
          <div class="h-8 bg-ink-200 dark:bg-ink-700 rounded-xl w-1/3"></div>
        </div>
      </div>
    </div>
  `,
};
