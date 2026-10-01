export default {
  name: "UserManagementModal",
  props: {
    show: Boolean,
  },
  emits: ["close"],
  data() {
    return {
      users: [],
      form: { username: "", password: "", role: "helper", full_name: "" },
      message: "",
      errorMsg: "",
    };
  },
  watch: {
    show(val) {
      if (val) this.fetchUsers();
    },
  },
  template: `
        <div v-if="show" class="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
                <div class="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>👥</span> Manajemen Akun Internal & Helper
                    </h3>
                    <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                </div>

                <div v-if="message" class="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">{{ message }}</div>
                <div v-if="errorMsg" class="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold">{{ errorMsg }}</div>

                <!-- Form Tambah Akun -->
                <form @submit.prevent="saveUser" class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 class="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Tambah Akun Baru</h4>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" v-model="form.full_name" required placeholder="Nama Lengkap" class="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg dark:text-white">
                        <input type="text" v-model="form.username" required placeholder="Username" class="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg dark:text-white">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" v-model="form.password" required placeholder="Password Teks" class="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg dark:text-white">
                        <select v-model="form.role" class="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border rounded-lg dark:text-white">
                            <option value="helper">Helper Boy</option>
                            <option value="admin">Admin Record</option>
                        </select>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition">Simpan Akun Baru</button>
                </form>

                <!-- List User -->
                <div class="flex-1 overflow-y-auto space-y-2 pr-1">
                    <h4 class="text-xs font-bold uppercase text-slate-400">Daftar Akun Terdaftar</h4>
                    <div v-for="u in users" :key="u.id" class="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                        <div>
                            <p class="font-bold text-slate-900 dark:text-white">{{ u.full_name }} <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold" :class="u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'">{{ u.role }}</span></p>
                            <p class="text-slate-400 text-[11px]">Username: <b>{{ u.username }}</b></p>
                        </div>
                        <button v-if="u.username !== 'admin'" @click="deleteUser(u.id)" class="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 text-xs">🗑️</button>
                    </div>
                </div>

                <button @click="$emit('close')" class="w-full bg-slate-900 dark:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold">Tutup</button>
            </div>
        </div>
    `,
  methods: {
    async fetchUsers() {
      try {
        const token = localStorage.getItem("gcwh_token");
        const res = await fetch(
          "https://garment-hub-production-c0a6.up.railway.app/api/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) this.users = await res.json();
      } catch (err) {}
    },
    async saveUser() {
      try {
        const token = localStorage.getItem("gcwh_token");
        const res = await fetch(
          "https://garment-hub-production-c0a6.up.railway.app/api/users",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(this.form),
          },
        );
        const data = await res.json();
        if (res.ok) {
          this.message = data.message;
          this.form = {
            username: "",
            password: "",
            role: "helper",
            full_name: "",
          };
          this.fetchUsers();
          setTimeout(() => (this.message = ""), 3000);
        } else {
          this.errorMsg = data.error;
          setTimeout(() => (this.errorMsg = ""), 3000);
        }
      } catch (err) {}
    },
    async deleteUser(id) {
      if (confirm("Yakin ingin menghapus akun ini?")) {
        const token = localStorage.getItem("gcwh_token");
        const res = await fetch(
          `https://garment-hub-production-c0a6.up.railway.app/api/users/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) this.fetchUsers();
      }
    },
  },
};
