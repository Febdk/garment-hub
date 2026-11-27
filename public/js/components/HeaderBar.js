export default {
  name: "HeaderBar",
  props: {
    isDarkMode: { type: Boolean, required: true },
    activeTab: { type: String, required: true },
    currentUser: { type: Object, default: null },
    isAdmin: { type: Boolean, default: false },
  },
  emits: [
    "toggle-theme",
    "open-logo",
    "open-user-modal",
    "open-audit-trail",
    "logout",
    "update:activeTab",
  ],
  setup(props, { emit }) {
    const { ref } = Vue;
    const isMenuOpen = ref(false);

    const switchTab = (tab) => {
      emit("update:activeTab", tab);
      isMenuOpen.value = false;
    };

    const handleAction = (event) => {
      emit(event);
      isMenuOpen.value = false;
    };

    return {
      isMenuOpen,
      switchTab,
      handleAction,
    };
  },
  template: `
    <header class="app-header sticky top-0 z-30">
      <div class="app-header__inner">
        <!-- Brand Lockup -->
        <div class="brand-lockup">
          <div class="brand-mark" aria-hidden="true">GC</div>
          <div class="brand-copy">
            <div class="brand-name">GCWH Garment Hub</div>
            <div class="brand-subtitle hidden sm:block">Warehouse operations console</div>
          </div>
        </div>

        <!-- DESKTOP TOOLBAR (md ke atas) -->
        <div class="header-toolbar hidden md:flex">
          <div v-if="currentUser" class="session-badge">
            <span class="session-dot" aria-hidden="true"></span>
            <span class="session-name">{{ currentUser.full_name || currentUser.username }}</span>
            <span class="role-badge">{{ isAdmin ? 'ADMIN' : 'HELPER' }}</span>
          </div>

          <div v-if="isAdmin" class="role-switcher" role="tablist" aria-label="Pilih workspace">
            <button type="button" role="tab" :aria-selected="activeTab === 'helper'" @click="$emit('update:activeTab', 'helper')" :class="['role-tab', { 'is-active': activeTab === 'helper' }]">
              Helper workspace
            </button>
            <button type="button" role="tab" :aria-selected="activeTab === 'admin'" @click="$emit('update:activeTab', 'admin')" :class="['role-tab', { 'is-active': activeTab === 'admin' }]">
              Admin console
            </button>
          </div>
          <div v-else class="workspace-label">Helper workspace</div>

          <button v-if="isAdmin" type="button" @click="$emit('open-user-modal')" class="header-action header-action--primary" title="Manajemen akun">
            <span aria-hidden="true">♙</span><span class="header-action__label">Akun</span>
          </button>
          <button v-if="isAdmin" type="button" @click="$emit('open-audit-trail')" class="header-action" title="Audit log">
            <span aria-hidden="true">▤</span><span class="header-action__label">Audit</span>
          </button>
          <button v-if="isAdmin" type="button" @click="$emit('open-logo')" class="header-action" title="Logo buyer">
            <span aria-hidden="true">▧</span><span class="header-action__label">Logo</span>
          </button>
          <button type="button" @click="$emit('toggle-theme')" class="header-icon-button" :aria-label="isDarkMode ? 'Gunakan light mode' : 'Gunakan dark mode'" :title="isDarkMode ? 'Light mode' : 'Dark mode'">
            <span aria-hidden="true">{{ isDarkMode ? '☀' : '◐' }}</span>
          </button>
          <button type="button" @click="$emit('logout')" class="header-action header-action--danger" title="Keluar sistem">
            <span aria-hidden="true">↪</span><span class="header-action__label">Keluar</span>
          </button>
        </div>

        <!-- MOBILE BAR (Ringkas di HP < md) -->
        <div class="flex items-center gap-2 md:hidden">
          <div v-if="currentUser" class="session-badge px-2 py-1 text-xs">
            <span class="session-dot" aria-hidden="true"></span>
            <span class="role-badge">{{ isAdmin ? (activeTab === 'admin' ? 'ADMIN' : 'HELPER') : 'HELPER' }}</span>
          </div>

          <button
            type="button"
            @click="isMenuOpen = !isMenuOpen"
            class="header-icon-button p-2 rounded-xl border border-ink-200 dark:border-ink-600 bg-paper-50 dark:bg-ink-800 text-ink-800 dark:text-ink-100 flex items-center justify-center min-w-[40px] min-h-[40px]"
            :aria-expanded="isMenuOpen"
            aria-label="Buka menu navigasi"
          >
            <span v-if="!isMenuOpen" class="text-base font-bold">☰</span>
            <span v-else class="text-base font-bold">✕</span>
          </button>
        </div>
      </div>

      <!-- MOBILE DROPDOWN / MENU DRAWER -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isMenuOpen" class="md:hidden border-t border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-4 py-4 space-y-4 shadow-xl">
          <!-- Info User -->
          <div v-if="currentUser" class="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-ink-800">
            <div>
              <p class="font-bold text-sm text-ink-900 dark:text-white">{{ currentUser.full_name || currentUser.username }}</p>
              <p class="text-xs text-ink-400 font-mono">Role: {{ currentUser.role || (isAdmin ? 'Admin' : 'Helper') }}</p>
            </div>
            <span class="role-badge">{{ isAdmin ? 'ADMIN' : 'HELPER' }}</span>
          </div>

          <!-- Switcher Workspace untuk Admin -->
          <div v-if="isAdmin" class="space-y-1.5">
            <p class="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Pilih Workspace</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="switchTab('helper')"
                :class="['py-2 px-3 rounded-xl font-bold text-xs text-center border transition', activeTab === 'helper' ? 'bg-hazard-500 text-white border-hazard-600' : 'bg-paper-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 border-ink-200 dark:border-ink-700']"
              >
                Helper View
              </button>
              <button
                type="button"
                @click="switchTab('admin')"
                :class="['py-2 px-3 rounded-xl font-bold text-xs text-center border transition', activeTab === 'admin' ? 'bg-hazard-500 text-white border-hazard-600' : 'bg-paper-100 dark:bg-ink-800 text-ink-700 dark:text-ink-300 border-ink-200 dark:border-ink-700']"
              >
                Admin Console
              </button>
            </div>
          </div>

          <!-- Fitur Khusus Admin -->
          <div v-if="isAdmin" class="space-y-1.5 pt-1">
            <p class="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Menu Admin</p>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                @click="handleAction('open-user-modal')"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800 text-ink-800 dark:text-ink-200 text-xs font-semibold"
              >
                <span class="text-base mb-0.5">♙</span>
                <span>Akun</span>
              </button>
              <button
                type="button"
                @click="handleAction('open-audit-trail')"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800 text-ink-800 dark:text-ink-200 text-xs font-semibold"
              >
                <span class="text-base mb-0.5">▤</span>
                <span>Audit</span>
              </button>
              <button
                type="button"
                @click="handleAction('open-logo')"
                class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-paper-50 dark:bg-ink-800 text-ink-800 dark:text-ink-200 text-xs font-semibold"
              >
                <span class="text-base mb-0.5">▧</span>
                <span>Logo</span>
              </button>
            </div>
          </div>

          <!-- Utilitas Sistem: Tema & Logout -->
          <div class="pt-2 border-t border-ink-100 dark:border-ink-800 flex items-center gap-2">
            <button
              type="button"
              @click="$emit('toggle-theme')"
              class="flex-1 py-2.5 px-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-paper-100 dark:bg-ink-800 text-ink-800 dark:text-ink-100 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <span>{{ isDarkMode ? '☀ Mode Terang' : '◐ Mode Gelap' }}</span>
            </button>
            <button
              type="button"
              @click="handleAction('logout')"
              class="flex-1 py-2.5 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>↪ Keluar</span>
            </button>
          </div>
        </div>
      </transition>
    </header>
  `,
};
