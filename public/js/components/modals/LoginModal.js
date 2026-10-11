export default {
  name: "LoginModal",
  props: {
    show: Boolean,
  },
  emits: ["login-success"],
  data() {
    return {
      form: {
        username: "",
        password: "",
      },
      showPassword: false,
      errorMsg: "",
      isLoading: false,
    };
  },
  template: `
    <div v-if="show" class="fixed inset-0 bg-ink-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-sm w-full p-6 sm:p-7 shadow-2xl border border-ink-200/80 dark:border-ink-700 space-y-5 transition-all">
        <div class="text-center space-y-1.5">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-hazard-600 text-white font-bold text-lg shadow-sm mb-1">
            GC
          </div>
          <h3 class="text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            Login GCWH Gudang
          </h3>
          <p class="text-xs text-ink-500 dark:text-ink-400">
            Masukkan akun internal pabrik untuk melanjutkan.
          </p>
        </div>

        <div v-if="errorMsg" class="p-3 bg-alarm-50 dark:bg-alarm-900/30 border border-alarm-200 dark:border-alarm-800 text-alarm-700 dark:text-alarm-300 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
          <svg class="w-4 h-4 shrink-0 text-alarm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ errorMsg }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              Username
            </label>
            <div class="relative">
              <input
                type="text"
                v-model="form.username"
                required
                autocomplete="username"
                placeholder="Masukkan username anda"
                class="w-full px-3.5 py-2.5 text-xs font-sans bg-ink-50/70 dark:bg-ink-900/70 border border-ink-300 dark:border-ink-600 rounded-xl focus:border-hazard-600 focus:ring-2 focus:ring-hazard-500/20 focus:outline-none dark:text-white transition"
              >
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300 mb-1.5">
              Password
            </label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full pl-3.5 pr-10 py-2.5 text-xs font-sans bg-ink-50/70 dark:bg-ink-900/70 border border-ink-300 dark:border-ink-600 rounded-xl focus:border-hazard-600 focus:ring-2 focus:ring-hazard-500/20 focus:outline-none dark:text-white transition"
              >
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition"
                tabindex="-1"
              >
                <svg v-if="!showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/>
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-hazard-600 hover:bg-hazard-700 active:scale-[0.99] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md shadow-hazard-600/20 mt-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg v-if="isLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isLoading ? 'Memverifikasi...' : 'Masuk Sistem' }}</span>
          </button>
        </form>

        <div class="pt-3 border-t border-ink-100 dark:border-ink-700/60 flex items-center justify-between text-[11px] text-ink-500 dark:text-ink-400">
          <span>🔒 Akses Terenkripsi JWT</span>
          <a href="/login.html" class="text-hazard-600 dark:text-hazard-400 hover:underline font-semibold">
            Buka Halaman Penuh &rarr;
          </a>
        </div>
      </div>
    </div>
  `,
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMsg = "";

      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const endpoints = isLocal
        ? [
            "/api/login",
            "https://garment-hub-production-c0a6.up.railway.app/api/login",
          ]
        : [
            "https://garment-hub-production-c0a6.up.railway.app/api/login",
            "/api/login",
          ];

      let success = false;
      let lastErrMsg = "Koneksi ke server gagal.";

      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.form),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.token) {
            success = true;
            localStorage.setItem("gcwh_token", data.token);
            localStorage.setItem("gcwh_user", JSON.stringify(data.user));
            this.$emit("login-success", data.user);
            break;
          } else {
            lastErrMsg = data.error || "Login gagal!";
            if (res.status === 400 || res.status === 401 || res.status === 429) {
              break;
            }
          }
        } catch (err) {
          console.warn("Gagal mencoba " + url, err);
        }
      }

      if (!success) {
        this.errorMsg = lastErrMsg;
      }
      this.isLoading = false;
    },
  },
};
