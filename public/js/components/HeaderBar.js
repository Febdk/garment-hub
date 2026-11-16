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
  template: `
    <header class="app-header sticky top-0 z-30">
      <div class="app-header__inner">
        <div class="brand-lockup">
          <div class="brand-mark" aria-hidden="true">GC</div>
          <div class="brand-copy">
            <div class="brand-name">GCWH Garment Hub</div>
            <div class="brand-subtitle">Warehouse operations console</div>
          </div>
        </div>

        <div class="header-toolbar">
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
      </div>
    </header>
  `,
};
