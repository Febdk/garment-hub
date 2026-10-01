export default {
  name: "HeaderBar",
  props: {
    isDarkMode: { type: Boolean, required: true },
    activeTab: { type: String, required: true },
    currentUser: { type: Object, default: null },
  },
  emits: [
    "toggle-theme",
    "open-logo",
    "open-user-modal",
    "open-audit-trail",
    "logout",
    "update:activeTab",
  ],
  template: `
    <header class="bg-ink-900 text-paper-50 sticky top-0 z-30 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="bg-hazard-500 text-ink-900 w-11 h-11 rounded-xl shadow-md flex items-center justify-center font-display font-bold text-lg">
            GC
          </div>
          <div>
            <h1 class="font-display text-xl font-bold tracking-tight text-paper-50">
              GCWH Garment Hub
            </h1>
            <p class="hdr-sub text-[11px] font-data uppercase tracking-wider text-ink-300">
              Warehouse &amp; Multi-Buyer Logistics
            </p>
          </div>
        </div>

        <div class="header-actions flex flex-wrap items-center gap-3">
          <!-- Info User Session & Badge Role -->
          <div v-if="currentUser" class="user-pill flex items-center gap-2 bg-ink-800 px-3 py-1.5 rounded-xl border border-ink-600 text-xs font-data">
            <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span class="text-paper-50"><b>{{ currentUser.fullname }}</b> (<span class="text-hazard-400 uppercase font-bold text-[10px]">{{ currentUser.role }}</span>)</span>
          </div>

          <!-- Tombol Manajemen Akun (Khusus Admin) -->
          <button
            v-if="currentUser && currentUser.role === 'admin'"
            @click="$emit('open-user-modal')"
            class="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white transition flex items-center gap-1.5 text-xs font-data font-semibold shadow-sm"
            title="Manajemen Akun Internal & Helper"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <span class="btn-label">Akun</span>
          </button>

          <button
            type="button"
            @click="$emit('open-audit-trail')"
            class="px-3 py-1.5 bg-hazard-50 hover:bg-hazard-100 dark:bg-hazard-700/20 text-hazard-700 dark:text-hazard-300 border border-hazard-200 dark:border-hazard-700 rounded-xl font-mono text-xs font-bold transition flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="btn-label">Audit Log</span>
          </button>

          <!-- Toggle Theme -->
          <button
            @click="$emit('toggle-theme')"
            class="p-2 rounded-xl bg-ink-800 hover:bg-ink-700 border border-ink-600 text-ink-200 hover:text-white transition flex items-center gap-2 text-xs font-data font-semibold"
            :title="isDarkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'"
          >
            <svg v-if="isDarkMode" class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <svg v-else class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
            <span v-if="isDarkMode" class="btn-label">Light</span>
            <span v-else class="btn-label">Dark</span>
          </button>

          <!-- Logo Buyer -->
          <button
            @click="$emit('open-logo')"
            class="p-2 rounded-xl bg-ink-800 hover:bg-ink-700 border border-ink-600 text-ink-200 hover:text-white transition flex items-center gap-1.5 text-xs font-data font-semibold"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <span class="btn-label">Logo Buyer</span>
          </button>

          <!-- Tab Selector -->
          <div class="tab-switch flex bg-ink-800/90 p-1.5 rounded-xl border border-ink-600/60 shadow-inner">
            <button
              @click="$emit('update:activeTab', 'helper')"
              :class="activeTab === 'helper' ? 'bg-hazard-500 text-ink-900 shadow-sm font-bold' : 'text-ink-200 hover:text-white font-medium'"
              class="tab-btn px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all font-data"
            >
              Helper
            </button>
            <button
              @click="$emit('update:activeTab', 'admin')"
              :class="activeTab === 'admin' ? 'bg-hazard-500 text-ink-900 shadow-sm font-bold' : 'text-ink-200 hover:text-white font-medium'"
              class="tab-btn px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all font-data"
            >
              Admin Record
            </button>
          </div>

          <!-- Tombol Logout -->
          <button
            @click="$emit('logout')"
            class="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 hover:text-white transition flex items-center gap-1.5 text-xs font-data font-semibold shadow-sm"
            title="Keluar Sistem"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="btn-label">Keluar</span>
          </button>
        </div>
      </div>
      <div class="tear-divider text-ink-500"></div>
    </header>
  `,
};
