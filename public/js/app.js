const { createApp, ref, computed, onMounted, watch } = Vue;

import { DEFAULT_BUYERS } from "./constants.js";
import { isUrgentPO } from "./utils.js";
import * as api from "./api.js";
import { verifyToken } from "./api.js";

import HeaderBar from "./components/HeaderBar.js";
import StatsCards from "./components/StatsCards.js";
import CriticalPanel from "./components/CriticalPanel.js";
import FilterToolbar from "./components/FilterToolbar.js";
import PoCard from "./components/PoCard.js";
import PoTable from "./components/PoTable.js";
import AdminForm from "./components/AdminForm.js";
import InspectionModal from "./components/modals/InspectionModal.js";
import LogoModal from "./components/modals/LogoModal.js";
import EditModal from "./components/modals/EditModal.js";
import PlacementModal from "./components/modals/PlacementModal.js";
import LoginModal from "./components/modals/LoginModal.js";
import UserManagementModal from "./components/modals/UserManagementModal.js";
import AuditTrailModal from "./components/modals/AuditTrailModal.js";
import SkeletonLoader from "./components/SkeletonLoader.js";

// --- KOMPONEN BARU V6 ---
import PoDetailDrawer from "./components/modals/PoDetailDrawer.js";
import CartonInModal from "./components/modals/CartonInModal.js";
import CartonOutModal from "./components/modals/CartonOutModal.js";

const app = createApp({
  components: {
    HeaderBar,
    StatsCards,
    CriticalPanel,
    FilterToolbar,
    PoCard,
    PoTable,
    AdminForm,
    InspectionModal,
    LogoModal,
    EditModal,
    PlacementModal,
    LoginModal,
    UserManagementModal,
    AuditTrailModal,
    SkeletonLoader,
    // --- REGISTER KOMPONEN V6 ---
    PoDetailDrawer,
    CartonInModal,
    CartonOutModal,
  },
  setup() {
    // State Sesi & Autentikasi
    const currentUser = ref(
      JSON.parse(localStorage.getItem("gcwh_user")) || null,
    );
    const showLoginModal = ref(!currentUser.value);
    const showUserModal = ref(false);
    const showAuditTrailModal = ref(false);

    const logout = () => {
      localStorage.removeItem("gcwh_token");
      localStorage.removeItem("gcwh_user");
      currentUser.value = null;
      showLoginModal.value = true;
    };

    const onLoginSuccess = (user) => {
      currentUser.value = user;
      showLoginModal.value = false;
      fetchData();
    };

    // State Aplikasi Utama & Tab Logic V6
    const isDarkMode = ref(localStorage.getItem("theme") === "dark");
    const activeTab = ref("admin"); // 'admin' | 'helper'
    const adminSubTab = ref("active"); // 'active' | 'overdue' | 'shipped' | 'archive' (sesuai index.html)

    const isLoading = ref(true);
    const items = ref([]);
    const buyers = ref([...DEFAULT_BUYERS]);
    const stats = ref({
      total_po: 0,
      total_actual_cartons: 0,
      total_target_cartons: 0,
      ready_to_ship: 0,
      revised_shipment_count: 0,
    });
    const searchQuery = ref("");
    const selectedBuyerFilter = ref("");
    const selectedStatusFilter = ref("");
    const filterUrgentOnly = ref(false);
    const message = ref("");

    // State Modals Lama
    const showPlacementModal = ref(false);
    const showEditModal = ref(false);
    const showInspectionModal = ref(false);
    const showLogoModal = ref(false);

    // --- STATE MODALS V6 (TRACKING KARTON) ---
    const showPoDrawer = ref(false);
    const showCartonInModal = ref(false);
    const showCartonOutModal = ref(false);
    const selectedPO = ref(null); // Data PO aktif untuk Drawer & Modal Karton

    const activePO = ref({});
    const activeColor = ref({});

    // --- FUNGSI TRIGGER DRAWER & MODAL V6 ---
    const openPoDrawer = (po) => {
      selectedPO.value = po;
      showPoDrawer.value = true;
    };

    const openCartonInModal = (po) => {
      selectedPO.value = po || selectedPO.value;
      showCartonInModal.value = true;
    };

    const openCartonOutModal = (po) => {
      selectedPO.value = po || selectedPO.value;
      showCartonOutModal.value = true;
    };

    const form = ref({
      buyer: "",
      customBuyer: "",
      po_number: "",
      style_code: "",
      ex_fty_date: "",
      colors: [{ color_code: "", total_qty: "" }],
    });

    const editForm = ref({
      id: null,
      buyer: "",
      customBuyer: "",
      po_number: "",
      style_code: "",
      ex_fty_date: "",
      revised_ex_fty_date: "",
      shipment_note: "",
      status: "Pending",
      inspector_name: "",
      inspection_datetime: "",
      colors: [],
    });

    const inspectionForm = ref({
      po_id: null,
      targetStatus: "",
      inspector_name: "",
      inspection_datetime: "",
    });

    const placementForm = ref({
      color_id: "",
      carton_qty: "",
      rack_location: "",
      helper_name: "",
    });

    // Toggle Dark & Light Mode
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value;
      if (isDarkMode.value) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    };

    // API Data Fetching dengan State Loading
    const fetchData = async () => {
      isLoading.value = true;
      try {
        const resBuyers = await api.getBuyers();
        if (resBuyers.ok) {
          const data = await resBuyers.json();
          if (Array.isArray(data) && data.length > 0) buyers.value = data;
        }
      } catch (e) {}

      try {
        const resData = await api.getPOs();
        if (resData.ok) {
          items.value = await resData.json();
          // Jika Drawer sedang terbuka, perbarui data selectedPO secara reaktif
          if (showPoDrawer.value && selectedPO.value) {
            const updatedPO = items.value.find(
              (p) => p.id === selectedPO.value.id,
            );
            if (updatedPO) selectedPO.value = updatedPO;
          }
        }
      } catch (e) {}

      try {
        const resStats = await api.getStats();
        if (resStats.ok) stats.value = await resStats.json();
      } catch (e) {}

      isLoading.value = false;
    };

    onMounted(async () => {
      if (isDarkMode.value) {
        document.documentElement.classList.add("dark");
      }

      window.addEventListener("gcwh-session-expired", () => {
        logout();
      });

      if (currentUser.value && localStorage.getItem("gcwh_token")) {
        try {
          const res = await verifyToken();
          if (res.ok) {
            fetchData();
          } else {
            logout();
          }
        } catch (e) {
          logout();
        }
      } else if (currentUser.value) {
        logout();
      }
    });

    const resetFilters = () => {
      searchQuery.value = "";
      selectedBuyerFilter.value = "";
      selectedStatusFilter.value = "";
      filterUrgentOnly.value = false;
    };

    const submitPO = async () => {
      const finalBuyer =
        form.value.buyer === "CUSTOM"
          ? form.value.customBuyer
          : form.value.buyer;
      const buyerObj = buyers.value.find((b) => b.name === finalBuyer);

      const payload = {
        buyer: finalBuyer,
        po_number: form.value.po_number,
        style_code: form.value.style_code,
        ex_fty_date: form.value.ex_fty_date,
        buyer_logo: buyerObj ? buyerObj.logo : null,
        colors: form.value.colors,
      };

      const res = await api.createPO(payload);
      if (res.ok) {
        message.value = `Master PO ${payload.po_number} berhasil disimpan!`;
        form.value = {
          buyer: "",
          customBuyer: "",
          po_number: "",
          style_code: "",
          ex_fty_date: "",
          colors: [{ color_code: "", total_qty: "" }],
        };
        fetchData();
        setTimeout(() => (message.value = ""), 4000);
      }
    };

    const openEditModal = (po) => {
      const isStandardBuyer = buyers.value.some((b) => b.name === po.buyer);
      const dateStr = po.ex_fty_date ? po.ex_fty_date.split("T")[0] : "";
      const revisedStr = po.revised_ex_fty_date
        ? po.revised_ex_fty_date.split("T")[0]
        : "";
      const nowISO = new Date().toISOString().slice(0, 16);

      const isInternal = po.status === "Inspection Internal";
      const inspectorName = isInternal
        ? po.inspection_internal_by || ""
        : po.inspection_external_by || "";
      const inspectorDt = isInternal
        ? po.inspection_internal_at
          ? new Date(po.inspection_internal_at).toISOString().slice(0, 16)
          : nowISO
        : po.inspection_external_at
          ? new Date(po.inspection_external_at).toISOString().slice(0, 16)
          : nowISO;

      editForm.value = {
        id: po.id,
        buyer: isStandardBuyer ? po.buyer : "CUSTOM",
        customBuyer: isStandardBuyer ? "" : po.buyer,
        po_number: po.po_number,
        style_code: po.style_code,
        ex_fty_date: dateStr,
        revised_ex_fty_date: revisedStr,
        shipment_note: po.shipment_note || "",
        status: po.status || "Pending",
        inspector_name: inspectorName,
        inspection_datetime: inspectorDt,
        colors: po.colors ? po.colors.map((c) => ({ ...c })) : [],
      };
      showEditModal.value = true;
    };

    const saveEditPO = async () => {
      try {
        const finalBuyer =
          editForm.value.buyer === "CUSTOM"
            ? editForm.value.customBuyer
            : editForm.value.buyer;
        const buyerObj = buyers.value.find((b) => b.name === finalBuyer);

        const payload = {
          buyer: finalBuyer,
          po_number: editForm.value.po_number,
          style_code: editForm.value.style_code,
          ex_fty_date: editForm.value.ex_fty_date,
          revised_ex_fty_date: editForm.value.revised_ex_fty_date || null,
          shipment_note: editForm.value.shipment_note || null,
          status: editForm.value.status || "Pending",
          buyer_logo: buyerObj ? buyerObj.logo : null,
          inspection_internal_by:
            editForm.value.status === "Inspection Internal"
              ? editForm.value.inspector_name
              : null,
          inspection_internal_at:
            editForm.value.status === "Inspection Internal"
              ? editForm.value.inspection_datetime
              : null,
          inspection_external_by:
            editForm.value.status === "Inspection External"
              ? editForm.value.inspector_name
              : null,
          inspection_external_at:
            editForm.value.status === "Inspection External"
              ? editForm.value.inspection_datetime
              : null,
          colors: editForm.value.colors,
        };

        const res = await api.updatePO(editForm.value.id, payload);

        if (res.ok) {
          message.value = `Master PO ${payload.po_number} berhasil diperbarui!`;
          showEditModal.value = false;
          fetchData();
          setTimeout(() => (message.value = ""), 4000);
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(
            "Gagal menyimpan perubahan: " +
              (errData.error || errData.message || "Kesalahan Server"),
          );
        }
      } catch (err) {
        alert("Terjadi kesalahan sistem: " + err.message);
      }
    };

    const openInspectionModalForPO = (po, targetStatus) => {
      const nowISO = new Date().toISOString().slice(0, 16);
      const defaultInspector =
        targetStatus === "Inspection Internal"
          ? po.inspection_internal_by || "Budi (QC Internal)"
          : po.inspection_external_by || "Alex (Intertek Auditor)";

      const existingDt =
        targetStatus === "Inspection Internal"
          ? po.inspection_internal_at
          : po.inspection_external_at;
      const defaultDt = existingDt
        ? new Date(existingDt).toISOString().slice(0, 16)
        : nowISO;

      inspectionForm.value = {
        po_id: po.id,
        targetStatus: targetStatus,
        inspector_name: defaultInspector,
        inspection_datetime: defaultDt,
      };
      showInspectionModal.value = true;
    };

    const handleStatusChange = (po, newStatus) => {
      if (
        newStatus === "Inspection Internal" ||
        newStatus === "Inspection External"
      ) {
        openInspectionModalForPO(po, newStatus);
      } else {
        updateStatus(po.id, newStatus);
      }
    };

    const submitInspection = async () => {
      const res = await api.updatePOStatus(inspectionForm.value.po_id, {
        status: inspectionForm.value.targetStatus,
        inspector_name: inspectionForm.value.inspector_name,
        inspection_datetime: inspectionForm.value.inspection_datetime,
      });
      if (res.ok) {
        message.value = `Status & Log ${inspectionForm.value.targetStatus} berhasil disimpan!`;
        showInspectionModal.value = false;
        fetchData();
        setTimeout(() => (message.value = ""), 3000);
      }
    };

    const updateStatus = async (id, status) => {
      const res = await api.updatePOStatus(id, { status });
      if (res.ok) {
        message.value = "Status PO berhasil diperbarui!";
        fetchData();
        setTimeout(() => (message.value = ""), 3000);
      }
    };

    const openUpdateLogoPrompt = async (buyer) => {
      const newUrl = prompt(
        `Masukkan URL Logo Baru untuk ${buyer.name}:`,
        buyer.logo || "",
      );
      if (newUrl !== null && newUrl.trim() !== "") {
        const res = await api.updateBuyerLogo({
          buyer_name: buyer.name,
          logo_url: newUrl.trim(),
        });
        if (res.ok) {
          message.value = `Logo ${buyer.name} berhasil diperbarui!`;
          fetchData();
        }
      }
    };

    const deletePO = async (id, poNumber) => {
      if (confirm(`Yakin mau menghapus PO ${poNumber}?`)) {
        const res = await api.removePO(id);
        if (res.ok) {
          message.value = `PO ${poNumber} berhasil dihapus!`;
          fetchData();
          setTimeout(() => (message.value = ""), 3000);
        }
      }
    };

    // Open Helper Placement Modal (Set Rak Murni)
    const openPlacementModal = (po, color) => {
      activePO.value = po;
      activeColor.value = color;
      placementForm.value = {
        color_id: color.id,
        rack_location: color.rack_location || "",
        carton_qty: color.carton_qty || 0,
        helper_name:
          color.helper_name || currentUser.value?.username || "Helper",
      };
      showPlacementModal.value = true;
    };

    const savePlacement = async () => {
      const res = await api.updateColorPlacement(placementForm.value);
      if (res.ok) {
        message.value = "Lokasi rak & Qty fisik warna berhasil diperbarui!";
        showPlacementModal.value = false;
        fetchData();
        setTimeout(() => (message.value = ""), 3000);
      }
    };

    const exportToExcel = () => {
      if (!items.value || items.value.length === 0) {
        alert("Tidak ada data PO untuk diexport!");
        return;
      }

      let csvContent = "\uFEFF";
      csvContent += `"LAPORAN REKAPITULASI GUDANG - GCWH GARMENT HUB"\r\n`;
      csvContent += `"Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}"\r\n\r\n`;
      csvContent += `"NO PO";"BUYER";"STYLE CODE";"STATUS";"EX-FTY DATE";"KODE WARNA";"TARGET KARTON";"FISIK KARTON";"LOKASI RAK";"HELPER"\r\n`;

      items.value.forEach((po) => {
        const poNum = po.po_number || "";
        const buyer = po.buyer || "";
        const style = po.style_code || "";
        const status = po.status || "";
        const exFty = po.ex_fty_date ? po.ex_fty_date.split("T")[0] : "";

        if (po.colors && po.colors.length > 0) {
          po.colors.forEach((c) => {
            const row = [
              `"${poNum}"`,
              `"${buyer}"`,
              `"${style}"`,
              `"${status}"`,
              `"${exFty}"`,
              `"${c.color_code || ""}"`,
              c.total_qty || 0,
              c.carton_qty || 0,
              `"${c.rack_location || "-"}"`,
              `"${c.helper_name || "-"}"`,
            ].join(";");
            csvContent += row + "\r\n";
          });
        } else {
          const row = [
            `"${poNum}"`,
            `"${buyer}"`,
            `"${style}"`,
            `"${status}"`,
            `"${exFty}"`,
            `"-"`,
            0,
            0,
            `"-"`,
            `"-"`,
          ].join(";");
          csvContent += row + "\r\n";
        }
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `GCWH_Warehouse_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const printReport = () => {
      window.print();
    };

    // --- LOGIKA PENGELOMPOKAN SUB-TAB ADMIN V6 ---
    const todayStr = computed(() => new Date().toISOString().split("T")[0]);

    // Helper kecil untuk mendapatkan tanggal acuan shipment (Revised Date jika ada, else Ex-Fty Date)
    const getEffectiveShipmentDate = (po) => {
      const d = po.revised_ex_fty_date || po.ex_fty_date;
      return d ? d.split("T")[0] : null;
    };

    // 1. ACTIVE: Shipment date >= hari ini (atau belum diset) & belum Shipped/Archived
    const activePOsList = computed(() => {
      return items.value.filter((po) => {
        if (po.status === "Shipped" || po.status === "Archived") return false;
        const shipDate = getEffectiveShipmentDate(po);
        if (!shipDate) return true;
        return shipDate >= todayStr.value;
      });
    });

    // 2. OVERDUE: Shipment date < hari ini & belum Shipped/Archived
    const overduePOsList = computed(() => {
      return items.value.filter((po) => {
        if (po.status === "Shipped" || po.status === "Archived") return false;
        const shipDate = getEffectiveShipmentDate(po);
        if (!shipDate) return false;
        return shipDate < todayStr.value;
      });
    });

    // 3. SHIPPED: Status = 'Shipped' DAN berusia <= 7 hari (belum masuk archive otomatis)
    const shippedPOsList = computed(() => {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();

      return items.value.filter((po) => {
        if (po.status !== "Shipped") return false;
        if (!po.updated_at) return true;
        const updatedAt = new Date(po.updated_at).getTime();
        return now - updatedAt <= SEVEN_DAYS_MS;
      });
    });

    // 4. ARCHIVE: Status = 'Archived' OR (Status = 'Shipped' & > 7 hari)
    const archivedPOsList = computed(() => {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();

      return items.value.filter((po) => {
        if (po.status === "Archived") return true;
        if (po.status === "Shipped") {
          if (!po.updated_at) return false;
          const updatedAt = new Date(po.updated_at).getTime();
          return now - updatedAt > SEVEN_DAYS_MS;
        }
        return false;
      });
    });

    // Badge counts untuk index.html
    const activePOsCount = computed(() => activePOsList.value.length);
    const overduePOsCount = computed(() => overduePOsList.value.length);
    const shippedPOsCount = computed(() => shippedPOsList.value.length);
    const archivedPOsCount = computed(() => archivedPOsList.value.length);

    const criticalPOs = computed(() =>
      items.value.filter((po) => isUrgentPO(po)),
    );

    // Filter PO berdasarkan Tab/Sub-Tab & Search
    const filteredPOs = computed(() => {
      let sourceList = items.value;

      if (activeTab.value === "admin") {
        switch (adminSubTab.value) {
          case "overdue":
            sourceList = overduePOsList.value;
            break;
          case "shipped":
            sourceList = shippedPOsList.value;
            break;
          case "archive":
            sourceList = archivedPOsList.value;
            break;
          case "active":
          default:
            sourceList = activePOsList.value;
            break;
        }
      } else if (activeTab.value === "helper") {
        // Helper fokus ke Active + Overdue yang butuh penataan karton
        sourceList = [...activePOsList.value, ...overduePOsList.value];
      }

      return sourceList.filter((po) => {
        if (filterUrgentOnly.value) {
          if (!isUrgentPO(po)) return false;
        }
        if (
          selectedBuyerFilter.value &&
          po.buyer !== selectedBuyerFilter.value
        ) {
          return false;
        }
        if (
          selectedStatusFilter.value &&
          po.status !== selectedStatusFilter.value
        ) {
          return false;
        }
        if (searchQuery.value) {
          const q = searchQuery.value.toLowerCase();
          const matchPO =
            po.po_number && po.po_number.toLowerCase().includes(q);
          const matchStyle =
            po.style_code && po.style_code.toLowerCase().includes(q);
          const matchBuyer = po.buyer && po.buyer.toLowerCase().includes(q);
          const matchInspector =
            (po.inspection_internal_by &&
              po.inspection_internal_by.toLowerCase().includes(q)) ||
            (po.inspection_external_by &&
              po.inspection_external_by.toLowerCase().includes(q));
          const matchColor =
            po.colors &&
            po.colors.some((c) => c.color_code.toLowerCase().includes(q));
          return (
            matchPO || matchStyle || matchBuyer || matchInspector || matchColor
          );
        }
        return true;
      });
    });

    const hasActiveFilters = computed(
      () =>
        !!(
          searchQuery.value ||
          selectedBuyerFilter.value ||
          selectedStatusFilter.value ||
          filterUrgentOnly.value
        ),
    );

    return {
      currentUser,
      showLoginModal,
      showUserModal,
      showAuditTrailModal,

      // State V6
      showPoDrawer,
      showCartonInModal,
      showCartonOutModal,
      selectedPO,
      openPoDrawer,
      openCartonInModal,
      openCartonOutModal,
      fetchData,

      logout,
      onLoginSuccess,
      isDarkMode,
      activeTab,
      adminSubTab, // Bind dengan sub-tab di index.html
      activePOsCount,
      overduePOsCount,
      shippedPOsCount,
      archivedPOsCount,

      isLoading,
      items,
      buyers,
      stats,
      searchQuery,
      selectedBuyerFilter,
      selectedStatusFilter,
      filterUrgentOnly,
      message,
      showPlacementModal,
      showEditModal,
      showInspectionModal,
      showLogoModal,
      activePO,
      activeColor,
      form,
      editForm,
      inspectionForm,
      placementForm,
      toggleTheme,
      resetFilters,
      submitPO,
      openEditModal,
      saveEditPO,
      openInspectionModalForPO,
      handleStatusChange,
      submitInspection,
      updateStatus,
      openUpdateLogoPrompt,
      deletePO,
      openPlacementModal,
      savePlacement,
      exportToExcel,
      printReport,
      criticalPOs,
      filteredPOs,
      hasActiveFilters,
    };
  },
});

app.mount("#app");
