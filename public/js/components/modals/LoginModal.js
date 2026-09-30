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
      errorMsg: "",
      isLoading: false,
    };
  },
  template: `
        <div v-if="show" class="fixed inset-0 bg-ink-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div class="bg-white dark:bg-ink-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-ink-200 dark:border-ink-700 space-y-4">
                <div class="text-center space-y-1">
                    <div class="inline-flex bg-hazard-500 text-ink-900 p-3 rounded-2xl shadow-md text-xl mb-1 font-display font-bold">
                        GC
                    </div>
                    <h3 class="text-lg font-bold text-ink-900 dark:text-white">Login GCWH Gudang</h3>
                    <p class="text-xs text-ink-400 font-data">Masukkan akun internal pabrik untuk melanjutkan.</p>
                </div>

                <div v-if="errorMsg" class="p-3 bg-alarm-50 dark:bg-alarm-950/60 border border-alarm-200 dark:border-alarm-900 text-alarm-700 dark:text-alarm-300 rounded-xl text-xs font-semibold text-center font-data">
                    {{ errorMsg }}
                </div>

                <form @submit.prevent="handleLogin" class="space-y-3.5">
                    <div>
                        <label class="block text-xs font-data font-bold text-ink-600 dark:text-ink-300 mb-1 uppercase">Username</label>
                        <input type="text" v-model="form.username" required placeholder="Masukkan username anda"
                               class="w-full px-3 py-2 text-xs font-sans bg-ink-50 dark:bg-ink-900 border border-ink-300 dark:border-ink-700 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white">
                    </div>

                    <div>
                        <label class="block text-xs font-data font-bold text-ink-600 dark:text-ink-300 mb-1 uppercase">Password</label>
                        <input type="password" v-model="form.password" required placeholder="••••••••"
                               class="w-full px-3 py-2 text-xs font-sans bg-ink-50 dark:bg-ink-900 border border-ink-300 dark:border-ink-700 rounded-xl focus:ring-2 focus:ring-hazard-500 focus:outline-none dark:text-white">
                    </div>

                    <button type="submit" :disabled="isLoading" class="w-full bg-hazard-500 hover:bg-hazard-600 disabled:opacity-50 text-ink-900 font-bold py-2.5 rounded-xl text-xs font-data transition shadow-sm mt-2 flex items-center justify-center gap-2">
                        <svg v-if="isLoading" class="animate-spin w-4 h-4 text-ink-900" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{{ isLoading ? 'Memproses...' : 'Masuk Sistem' }}</span>
                    </button>
                </form>

                <div class="pt-2 border-t border-ink-100 dark:border-ink-700 text-[11px] font-data text-center text-ink-400">
                    🔒 Autentikasi aman (JWT + bcrypt)
                </div>
            </div>
        </div>
    `,
  methods: {
    async handleLogin() {
      this.isLoading = true;
      try {
        const res = await fetch(
          "https://garment-hub-production-c0a6.up.railway.app/api/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.form),
          },
        );
        const data = await res.json();
        if (res.ok) {
          this.errorMsg = "";
          // Simpan JWT token dan user data
          localStorage.setItem("gcwh_token", data.token);
          localStorage.setItem("gcwh_user", JSON.stringify(data.user));
          this.$emit("login-success", data.user);
        } else {
          this.errorMsg = data.error || "Login gagal!";
        }
      } catch (err) {
        this.errorMsg = "Terjadi kesalahan koneksi server.";
      } finally {
        this.isLoading = false;
      }
    },
  },
};
