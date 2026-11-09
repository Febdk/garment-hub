const { createApp, ref, computed, onMounted } = Vue;

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

// --- KOMPONEN BULK UPLOAD PO ---
import BulkUploadModal from "./components/modals/BulkUploadModal.js";

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
    // --- REGISTER BULK UPLOAD PO ---
    BulkUploadModal,
  },
  setup() {
    // State Sesi & Autentikasi
    const currentUser = ref(
      JSON.parse(localStorage.getItem("gcwh_user")) || null,
    );
    const showLoginModal = ref(!currentUser.value);
    const showUserModal = ref(false);
    const showAuditTrailModal = ref(false);
    const showBulkUploadModal = ref(false);

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

    // State Aplikasi Utama & Tab Logic
    const isDarkMode = ref(localStorage.getItem("theme") === "dark");
    const activeTab = ref("admin"); // 'admin' | 'helper'
    const adminSubTab = ref("active"); // 'active' | 'overdue' | 'shipped' | 'archive'
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
    const selectedDateFilter = ref("");
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
    const selectedPO = ref(null); // Menyimpan data PO yang sedang diklik untuk Drawer

    const activePO = ref({});
    const activeColor = ref({});

    // --- FUNGSI TRIGGER DRAWER V6 ---
    const openPoDrawer = (po) => {
      selectedPO.value = po;
      showPoDrawer.value = true;
    };

    const openCartonInModal = (po) => {
      selectedPO.value = po;
      showCartonInModal.value = true;
    };

    const openCartonOutModal = (po) => {
      selectedPO.value = po;
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
      selectedDateFilter.value = "";
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
        // carton_qty & helper_name tidak perlu dikirim lagi dari form ini
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
      const pos = filteredPOs.value && filteredPOs.value.length > 0 ? filteredPOs.value : items.value;
      if (!pos || pos.length === 0) {
        alert("Tidak ada data PO untuk diexport!");
        return;
      }

      const activeTabName = adminSubTab.value || "all";
      const exportDateStr = new Date().toISOString().slice(0, 10);
      const printDateStr = new Date().toLocaleDateString("id-ID");

      // ── Cek Ketersediaan Library SheetJS (XLSX) untuk Export File .xlsx Murni ──
      if (typeof XLSX !== "undefined") {
        const excelRows = [];
        let no = 1;

        pos.forEach((po) => {
          const poNum = po.po_number || "";
          const buyer = po.buyer || "";
          const style = po.style_code || "";
          const status = po.status || "";
          const exFty = po.ex_fty_date ? po.ex_fty_date.split("T")[0] : "";
          const revExFty = po.revised_ex_fty_date
            ? po.revised_ex_fty_date.split("T")[0]
            : "";
          const qtyIn = Number(po.qty_in) || 0;
          const qtyOut = Number(po.qty_out) || 0;
          const colors = po.colors && po.colors.length > 0 ? po.colors : null;

          if (colors) {
            colors.forEach((c) => {
              excelRows.push({
                "NO": no,
                "BUYER": buyer,
                "NO. PO": poNum,
                "STYLE CODE": style,
                "EX-FTY SHIPMENT": exFty,
                "REVISI SHIPMENT": revExFty,
                "KODE WARNA": c.color_code || "-",
                "TARGET KARTON": Number(c.total_qty) || 0,
                "KARTON MASUK": qtyIn,
                "KARTON KELUAR": qtyOut,
                "FISIK RAK": Number(c.carton_qty) || 0,
                "LOKASI RAK": c.rack_location || "BELUM SET",
                "STATUS PO": status,
                "INSPEKSI INTERNAL": po.inspection_internal_by || "-",
                "INSPEKSI EKSTERNAL": po.inspection_external_by || "-",
                "HELPER GUDANG": c.helper_name || "-",
              });
            });
          } else {
            excelRows.push({
              "NO": no,
              "BUYER": buyer,
              "NO. PO": poNum,
              "STYLE CODE": style,
              "EX-FTY SHIPMENT": exFty,
              "REVISI SHIPMENT": revExFty,
              "KODE WARNA": "-",
              "TARGET KARTON": Number(po.total_qty) || 0,
              "KARTON MASUK": qtyIn,
              "KARTON KELUAR": qtyOut,
              "FISIK RAK": 0,
              "LOKASI RAK": "-",
              "STATUS PO": status,
              "INSPEKSI INTERNAL": po.inspection_internal_by || "-",
              "INSPEKSI EKSTERNAL": po.inspection_external_by || "-",
              "HELPER GUDANG": "-",
            });
          }
          no++;
        });

        const ws = XLSX.utils.json_to_sheet(excelRows);
        ws["!cols"] = [
          { wch: 6 },  // NO
          { wch: 22 }, // BUYER
          { wch: 18 }, // NO. PO
          { wch: 16 }, // STYLE CODE
          { wch: 16 }, // EX-FTY SHIPMENT
          { wch: 16 }, // REVISI SHIPMENT
          { wch: 14 }, // KODE WARNA
          { wch: 14 }, // TARGET KARTON
          { wch: 14 }, // KARTON MASUK
          { wch: 14 }, // KARTON KELUAR
          { wch: 12 }, // FISIK RAK
          { wch: 14 }, // LOKASI RAK
          { wch: 20 }, // STATUS PO
          { wch: 20 }, // INSPEKSI INTERNAL
          { wch: 20 }, // INSPEKSI EKSTERNAL
          { wch: 16 }, // HELPER GUDANG
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekapitulasi PO");
        XLSX.writeFile(wb, `GCWH_Rekap_PO_${activeTabName}_${exportDateStr}.xlsx`);
        return;
      }

      // ── Fallback ke Format CSV (UTF-8 BOM) jika Library XLSX Belum Dimuat ──
      let csvContent = "\uFEFF";
      csvContent += `"LAPORAN REKAPITULASI GUDANG - PT. GARMENT HUB INDONESIA (GCWH)"\r\n`;
      csvContent += `"Kategori Sub-Tab: ${activeTabName.toUpperCase()}"\r\n`;
      csvContent += `"Tanggal Cetak: ${printDateStr}"\r\n\r\n`;
      csvContent += `"NO";"BUYER";"NO PO";"STYLE CODE";"EX-FTY SHIPMENT";"REVISI SHIPMENT";"KODE WARNA";"TARGET KARTON";"KARTON MASUK";"KARTON KELUAR";"FISIK RAK";"LOKASI RAK";"STATUS PO";"INSPEKSI INTERNAL";"INSPEKSI EKSTERNAL";"HELPER"\r\n`;

      let rowNo = 1;
      pos.forEach((po) => {
        const poNum = po.po_number || "";
        const buyer = po.buyer || "";
        const style = po.style_code || "";
        const status = po.status || "";
        const exFty = po.ex_fty_date ? po.ex_fty_date.split("T")[0] : "";
        const revExFty = po.revised_ex_fty_date ? po.revised_ex_fty_date.split("T")[0] : "";
        const qtyIn = Number(po.qty_in) || 0;
        const qtyOut = Number(po.qty_out) || 0;
        const inspInt = po.inspection_internal_by || "-";
        const inspExt = po.inspection_external_by || "-";

        if (po.colors && po.colors.length > 0) {
          po.colors.forEach((c) => {
            const row = [
              rowNo,
              `"${buyer}"`,
              `"${poNum}"`,
              `"${style}"`,
              `"${exFty}"`,
              `"${revExFty}"`,
              `"${c.color_code || ""}"`,
              c.total_qty || 0,
              qtyIn,
              qtyOut,
              c.carton_qty || 0,
              `"${c.rack_location || "-"}"`,
              `"${status}"`,
              `"${inspInt}"`,
              `"${inspExt}"`,
              `"${c.helper_name || "-"}"`,
            ].join(";");
            csvContent += row + "\r\n";
          });
        } else {
          const row = [
            rowNo,
            `"${buyer}"`,
            `"${poNum}"`,
            `"${style}"`,
            `"${exFty}"`,
            `"${revExFty}"`,
            `"-"`,
            po.total_qty || 0,
            qtyIn,
            qtyOut,
            0,
            `"-"`,
            `"${status}"`,
            `"${inspInt}"`,
            `"${inspExt}"`,
            `"-"`,
          ].join(";");
          csvContent += row + "\r\n";
        }
        rowNo++;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute(
        "download",
        `GCWH_Rekap_PO_${activeTabName}_${exportDateStr}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const printReport = () => {
      const pos = filteredPOs.value && filteredPOs.value.length > 0 ? filteredPOs.value : items.value;
      if (!pos || pos.length === 0) {
        alert("Tidak ada data PO untuk dicetak!");
        return;
      }

      // Label sub-tab untuk judul laporan resmi
      const subTabLabels = {
        active: "LAPORAN PURCHASE ORDER AKTIF & ON-PROCESS",
        overdue: "LAPORAN PURCHASE ORDER OVERDUE / JATUH TEMPO",
        shipped: "LAPORAN PURCHASE ORDER SELESAI KIRIM (SHIPPED)",
        archive: "LAPORAN ARSIP PURCHASE ORDER GUDANG",
      };
      const reportTitle =
        subTabLabels[adminSubTab.value] || "LAPORAN MONITORING PURCHASE ORDER (PO) & SHIPMENT";

      const now = new Date();
      const printDate = now.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const printTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const printedBy = currentUser.value
        ? `${currentUser.value.full_name || currentUser.value.username} (${(currentUser.value.role || "Admin").toUpperCase()})`
        : "Administrator Gudang";

      // ── Kalkulasi Metrik & Summary Real-time ──
      const totalPO = pos.length;
      const totalKartonTarget = pos.reduce(
        (s, po) =>
          s +
          (po.colors && po.colors.length > 0
            ? po.colors.reduce((cs, c) => cs + (Number(c.total_qty) || 0), 0)
            : Number(po.total_qty) || 0),
        0,
      );
      const totalKartonMasuk = pos.reduce(
        (s, po) => s + (Number(po.qty_in) || 0),
        0,
      );
      const totalKartonKeluar = pos.reduce(
        (s, po) => s + (Number(po.qty_out) || 0),
        0,
      );
      const totalKartonFisik = pos.reduce(
        (s, po) =>
          s +
          (po.colors && po.colors.length > 0
            ? po.colors.reduce((cs, c) => cs + (Number(c.carton_qty) || 0), 0)
            : 0),
        0,
      );

      const pctRealisasi =
        totalKartonTarget > 0
          ? ((totalKartonMasuk / totalKartonTarget) * 100).toFixed(1)
          : "0.0";

      const statusCount = {};
      pos.forEach((po) => {
        const st = po.status || "Pending";
        statusCount[st] = (statusCount[st] || 0) + 1;
      });

      const statusBadgeStyle = (s) => {
        const m = {
          Pending: "background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;",
          "Inspection Internal": "background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;",
          "Inspection External": "background:#faf5ff;color:#6b21a8;border:1px solid #e9d5ff;",
          "Ready to Ship": "background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;",
          Shipped: "background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;",
          Archived: "background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;",
        };
        return m[s] || "background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;";
      };

      // ── Susun Baris Tabel Data ──
      let rows = "";
      pos.forEach((po, idx) => {
        const exFty = po.ex_fty_date ? po.ex_fty_date.split("T")[0] : "-";
        const revised = po.revised_ex_fty_date
          ? po.revised_ex_fty_date.split("T")[0]
          : null;
        const shipDate = revised || exFty;
        const colors = po.colors || [];
        const rowspan = Math.max(colors.length, 1);
        const isOverdue =
          shipDate < now.toISOString().split("T")[0] &&
          !["Shipped", "Archived"].includes(po.status);

        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        const qtyIn = Number(po.qty_in) || 0;
        const qtyOut = Number(po.qty_out) || 0;

        // Kolom Karton Masuk (data karton masuk terinput dari detail PO)
        const cellKtnMasuk = `
          <td rowspan="${rowspan}" style="text-align:center;vertical-align:middle;background:${rowBg};border:1px solid #cbd5e1;">
            <div style="font-size:12px;font-weight:800;font-family:Consolas, monospace;color:#047857">
              ${qtyIn.toLocaleString("id-ID")}
            </div>
            <div style="font-size:8px;color:#64748b;text-transform:uppercase;letter-spacing:0.3px">Ktn Masuk</div>
            ${qtyOut > 0 ? `<div style="font-size:8px;color:#be123c;font-weight:700;margin-top:2px">Keluar: ${qtyOut.toLocaleString("id-ID")}</div>` : ""}
          </td>
        `;

        if (colors.length === 0) {
          rows += `
            <tr style="background:${rowBg}">
              <td style="text-align:center;font-weight:700;color:#64748b;border:1px solid #cbd5e1">${idx + 1}</td>
              <td style="border:1px solid #cbd5e1">
                <span style="font-size:9px;font-weight:800;color:#0f2744;text-transform:uppercase">${po.buyer || "-"}</span>
              </td>
              <td style="font-weight:800;font-family:Consolas, monospace;font-size:11px;color:#0f2744;border:1px solid #cbd5e1">${po.po_number || "-"}</td>
              <td style="font-family:Consolas, monospace;font-size:10px;font-weight:600;color:#334155;border:1px solid #cbd5e1">${po.style_code || "-"}</td>
              <td style="font-family:Consolas, monospace;text-align:center;border:1px solid #cbd5e1;${isOverdue ? "color:#be123c;font-weight:800;" : "color:#1e293b;"}">
                ${revised ? `<span style="text-decoration:line-through;color:#94a3b8;font-size:9px">${exFty}</span><br><span style="color:#be123c;font-weight:800">${revised} [REV]</span>` : shipDate}
              </td>
              <td style="text-align:center;color:#94a3b8;border:1px solid #cbd5e1">-</td>
              <td style="text-align:right;font-weight:700;font-family:Consolas, monospace;font-size:11px;border:1px solid #cbd5e1">${(po.total_qty || 0).toLocaleString("id-ID")}</td>
              ${cellKtnMasuk}
              <td style="text-align:right;font-weight:700;font-family:Consolas, monospace;font-size:11px;color:#64748b;border:1px solid #cbd5e1">-</td>
              <td style="text-align:center;color:#94a3b8;border:1px solid #cbd5e1">-</td>
              <td style="text-align:center;border:1px solid #cbd5e1">
                <span style="${statusBadgeStyle(po.status)};padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;display:inline-block">${po.status || "-"}</span>
              </td>
            </tr>`;
        } else {
          colors.forEach((c, ci) => {
            const isFirst = ci === 0;
            const targetColorQty = Number(c.total_qty) || 0;
            const fisikColorQty = Number(c.carton_qty) || 0;
            const rackLoc = c.rack_location && c.rack_location !== "-" && c.rack_location !== "BELUM SET"
              ? c.rack_location
              : "BELUM SET";
            const isRackSet = rackLoc !== "BELUM SET";

            rows += `
              <tr style="background:${rowBg}">
                ${isFirst ? `<td rowspan="${rowspan}" style="text-align:center;font-weight:700;color:#64748b;vertical-align:middle;border:1px solid #cbd5e1">${idx + 1}</td>` : ""}
                ${isFirst ? `<td rowspan="${rowspan}" style="vertical-align:middle;border:1px solid #cbd5e1"><span style="font-size:10px;font-weight:800;color:#0f2744;text-transform:uppercase">${po.buyer || "-"}</span></td>` : ""}
                ${isFirst ? `<td rowspan="${rowspan}" style="font-weight:800;font-family:Consolas, monospace;font-size:11px;color:#0f2744;vertical-align:middle;border:1px solid #cbd5e1">${po.po_number || "-"}</td>` : ""}
                ${isFirst ? `<td rowspan="${rowspan}" style="font-family:Consolas, monospace;font-size:10px;font-weight:600;color:#334155;vertical-align:middle;border:1px solid #cbd5e1">${po.style_code || "-"}</td>` : ""}
                ${
                  isFirst
                    ? `<td rowspan="${rowspan}" style="font-family:Consolas, monospace;text-align:center;vertical-align:middle;border:1px solid #cbd5e1;${isOverdue ? "color:#be123c;font-weight:800;" : "color:#1e293b;"}">
                  ${revised ? `<span style="text-decoration:line-through;color:#94a3b8;font-size:9px">${exFty}</span><br><span style="color:#be123c;font-weight:800">${revised} [REV]</span>` : shipDate}
                </td>`
                    : ""
                }
                <td style="font-family:Consolas, monospace;font-size:10px;font-weight:700;text-align:center;color:#0f2744;border:1px solid #cbd5e1">${c.color_code || "-"}</td>
                <td style="text-align:right;font-weight:700;font-family:Consolas, monospace;font-size:11px;color:#0f2744;border:1px solid #cbd5e1">${targetColorQty.toLocaleString("id-ID")}</td>
                ${isFirst ? cellKtnMasuk : ""}
                <td style="text-align:right;font-weight:700;font-family:Consolas, monospace;font-size:11px;color:#0f2744;border:1px solid #cbd5e1">${fisikColorQty.toLocaleString("id-ID")}</td>
                <td style="text-align:center;font-family:Consolas, monospace;font-size:10px;font-weight:700;border:1px solid #cbd5e1;color:${isRackSet ? "#0f2744" : "#be123c"}">
                  ${isRackSet ? rackLoc : '<span style="background:#fff1f2;color:#be123c;padding:1px 5px;border-radius:4px;border:1px solid #fecdd3">BELUM SET</span>'}
                </td>
                ${
                  isFirst
                    ? `<td rowspan="${rowspan}" style="text-align:center;vertical-align:middle;border:1px solid #cbd5e1">
                  <span style="${statusBadgeStyle(po.status)};padding:3px 8px;border-radius:6px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;display:inline-block">${po.status || "-"}</span>
                </td>`
                    : ""
                }
              </tr>`;
          });
        }
      });

      // ── Status Pills Mini Summary ──
      const statusPills = Object.entries(statusCount)
        .map(
          ([s, n]) =>
            `<span style="${statusBadgeStyle(s)};padding:3px 10px;border-radius:6px;font-size:9px;font-weight:800;margin-right:6px;display:inline-block">
              ${s.toUpperCase()}: <b style="font-size:11px">${n}</b>
            </span>`,
        )
        .join("");

      // ── Template HTML Dokumen Standar Laporan PT ──
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} — PT. GARMENT HUB INDONESIA</title>
  <style>
    @page { 
      size: A4 landscape; 
      margin: 10mm 12mm 12mm 12mm; 
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      font-size: 10px; 
      color: #0f172a; 
      background: #fff; 
      line-height: 1.35;
    }

    /* ── KOP SURAT FORMAL STANDAR PT ── */
    .kop-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
    }
    .kop-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .kop-logo {
      width: 44px;
      height: 44px;
      background: #0f2744;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 19px;
      font-weight: 900;
      letter-spacing: -1px;
      font-family: "Segoe UI", Arial, sans-serif;
      box-shadow: 0 2px 4px rgba(15, 39, 68, 0.2);
    }
    .kop-company h1 {
      font-size: 15px;
      font-weight: 900;
      color: #0f2744;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .kop-company h2 {
      font-size: 10px;
      font-weight: 700;
      color: #2563eb;
      letter-spacing: 0.2px;
      text-transform: uppercase;
    }
    .kop-company p {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 2px;
    }

    /* ── KOTAK DOKUMEN KONTROL RESMI ── */
    .kop-control {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 8.5px;
      min-width: 230px;
      text-align: left;
    }
    .kop-control table {
      width: 100%;
      border-collapse: collapse;
    }
    .kop-control td {
      padding: 1.5px 3px;
      border: none !important;
    }
    .kop-control td.lbl {
      color: #64748b;
      font-weight: 600;
      width: 80px;
    }
    .kop-control td.val {
      color: #0f2744;
      font-weight: 700;
      font-family: Consolas, monospace;
    }

    /* ── GARIS GANDA KOP RESMI PT ── */
    .kop-divider {
      margin-top: 4px;
      margin-bottom: 10px;
      border-top: 2.5px solid #0f2744;
      border-bottom: 1px solid #0f2744;
      height: 3px;
    }

    /* ── JUDUL LAPORAN ── */
    .report-header {
      text-align: center;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 13px;
      font-weight: 900;
      color: #0f2744;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .report-subtitle {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      margin-top: 1px;
    }

    /* ── EXECUTIVE SUMMARY METRICS ── */
    .summary-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .metric-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .metric-item {
      text-align: center;
    }
    .metric-item .val {
      font-size: 15px;
      font-weight: 900;
      font-family: Consolas, monospace;
      color: #0f2744;
      line-height: 1;
    }
    .metric-item .val.green { color: #047857; }
    .metric-item .val.red   { color: #be123c; }
    .metric-item .lbl {
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 3px;
    }
    .metric-sep {
      width: 1px;
      height: 24px;
      background: #cbd5e1;
    }
    .status-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }

    /* ── TABEL UTAMA LAPORAN ── */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      border: 1.5px solid #0f2744;
    }
    table.data-table thead tr {
      background: #0f2744;
      color: #ffffff;
    }
    table.data-table th {
      padding: 6px 5px;
      font-weight: 800;
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border: 1px solid #1e3a5f;
      text-align: left;
    }
    table.data-table th.center { text-align: center; }
    table.data-table th.right  { text-align: right; }
    table.data-table td {
      padding: 4px 6px;
      vertical-align: middle;
      border: 1px solid #cbd5e1;
    }
    table.data-table tfoot tr {
      background: #f1f5f9;
      font-weight: 800;
      border-top: 2px solid #0f2744;
      border-bottom: 2.5px double #0f2744;
    }
    table.data-table tfoot td {
      padding: 5px 6px;
      font-size: 9.5px;
      border: 1px solid #cbd5e1;
    }

    /* ── LEMBAR PENGESAHAN / SIGNATURE ── */
    .signature-section {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-meta {
      width: 38%;
      font-size: 8px;
      color: #64748b;
      line-height: 1.5;
    }
    .sig-meta .note-title {
      font-weight: 800;
      color: #0f2744;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .sig-boxes {
      width: 60%;
      display: flex;
      justify-content: flex-end;
      gap: 20px;
    }
    .sig-card {
      width: 140px;
      text-align: center;
      font-size: 8.5px;
    }
    .sig-card .sig-role {
      font-weight: 800;
      color: #0f2744;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .sig-card .sig-date {
      font-size: 8px;
      color: #64748b;
      margin-bottom: 40px;
    }
    .sig-card .sig-line {
      border-bottom: 1px solid #0f2744;
      margin-bottom: 3px;
    }
    .sig-card .sig-name {
      font-weight: 700;
      color: #0f2744;
      font-size: 8.5px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- ── 1. KOP SURAT RESMI PT ── -->
  <div class="kop-wrapper">
    <div class="kop-brand">
      <div class="kop-logo">GC</div>
      <div class="kop-company">
        <h1>PT. UNGARAN SARI GARMENT</h1>
        <h2>Warehouse, Finishing &amp; Multi-Buyer Logistics Hub</h2>
        <p>Kawasan Industri Manufaktur Garment | Dokumen Internal Resmi Pergudangan</p>
      </div>
    </div>
    <div class="kop-control">
      <table>
        <tr>
          <td class="lbl">No. Formulir</td>
          <td class="val">: FRM-WHS-PO-04</td>
        </tr>
        <tr>
          <td class="lbl">Klasifikasi</td>
          <td class="val">: INTERNAL REPORT</td>
        </tr>
        <tr>
          <td class="lbl">Waktu Cetak</td>
          <td class="val">: ${printDate}, ${printTime} WIB</td>
        </tr>
        <tr>
          <td class="lbl">Operator Cetak</td>
          <td class="val">: ${printedBy}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="kop-divider"></div>

  <!-- ── 2. JUDUL LAPORAN ── -->
  <div class="report-header">
    <div class="report-title">${reportTitle}</div>
    <div class="report-subtitle">Rekapitulasi Fisik Karton, Mutasi Masuk/Keluar &amp; Status Kesiapan Pengiriman</div>
  </div>

  <!-- ── 3. EXECUTIVE SUMMARY METRICS ── -->
  <div class="summary-box">
    <div class="metric-group">
      <div class="metric-item">
        <div class="val">${totalPO}</div>
        <div class="lbl">Total PO</div>
      </div>
      <div class="metric-sep"></div>
      <div class="metric-item">
        <div class="val">${totalKartonTarget.toLocaleString("id-ID")}</div>
        <div class="lbl">Target Karton</div>
      </div>
      <div class="metric-sep"></div>
      <div class="metric-item">
        <div class="val green">${totalKartonMasuk.toLocaleString("id-ID")}</div>
        <div class="lbl">Karton Masuk (${pctRealisasi}%)</div>
      </div>
      <div class="metric-sep"></div>
      <div class="metric-item">
        <div class="val red">${totalKartonKeluar.toLocaleString("id-ID")}</div>
        <div class="lbl">Karton Keluar</div>
      </div>
      <div class="metric-sep"></div>
      <div class="metric-item">
        <div class="val">${totalKartonFisik.toLocaleString("id-ID")}</div>
        <div class="lbl">Fisik di Rak</div>
      </div>
    </div>

    <div class="status-summary">
      ${statusPills}
    </div>
  </div>

  <!-- ── 4. TABEL DATA RESMI ── -->
  <table class="data-table">
    <thead>
      <tr>
        <th style="width:26px" class="center">No</th>
        <th style="width:95px">Buyer</th>
        <th style="width:95px">No. PO</th>
        <th style="width:85px">Style Code</th>
        <th style="width:85px" class="center">Ex-Fty / Shipment</th>
        <th style="width:65px" class="center">Warna</th>
        <th style="width:68px" class="right">Target Ktn</th>
        <th style="width:78px" class="center">Ktn Masuk</th>
        <th style="width:68px" class="right">Fisik Rak</th>
        <th style="width:78px" class="center">Lokasi Rak</th>
        <th style="width:95px" class="center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" style="text-align:right;font-weight:800;color:#0f2744;text-transform:uppercase;letter-spacing:0.5px">TOTAL AKUMULASI GUDANG:</td>
        <td style="text-align:right;font-weight:900;font-family:Consolas, monospace;color:#0f2744;font-size:10.5px">${totalKartonTarget.toLocaleString("id-ID")}</td>
        <td style="text-align:center;font-weight:900;font-family:Consolas, monospace;color:#047857;font-size:10.5px">${totalKartonMasuk.toLocaleString("id-ID")}</td>
        <td style="text-align:right;font-weight:900;font-family:Consolas, monospace;color:#0f2744;font-size:10.5px">${totalKartonFisik.toLocaleString("id-ID")}</td>
        <td colspan="2" style="text-align:center;font-size:8.5px;color:#64748b">Verified by GCWH System</td>
      </tr>
    </tfoot>
  </table>

  <!-- ── 5. LEMBAR PENGESAHAN (APPROVAL MATRIX) ── -->
  <div class="signature-section">
    <div class="sig-meta">
      <div class="note-title">Catatan Pengesahan Laporan:</div>
      <p>1. Data pergerakan karton masuk dan keluar bersumber langsung dari catatan operasional real-time Gudang GCWH.</p>
      <p>2. Laporan ini merupakan dokumen resmi pendukung audit kepatuhan buyer, inspeksi QC dan serah terima logistik.</p>
      <p>3. Dilarang melakukan perubahan data secara manual tanpa otorisasi Supervisor Gudang &amp; Factory Manager.</p>
    </div>

    <div class="sig-boxes">
      <div class="sig-card">
        <div class="sig-role">Dibuat Oleh:</div>
        <div class="sig-date">Tgl: ${printDate}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${currentUser.value ? (currentUser.value.full_name || currentUser.value.username) : "Warehouse Admin"}</div>
        <div style="font-size:7.5px;color:#64748b">Warehouse Administrator</div>
      </div>

      <div class="sig-card">
        <div class="sig-role">Diperiksa Oleh:</div>
        <div class="sig-date">Tgl: .................................</div>
        <div class="sig-line"></div>
        <div class="sig-name">( ..................................... )</div>
        <div style="font-size:7.5px;color:#64748b">Supervisor  &amp; Finishing</div>
      </div>

      <div class="sig-card">
        <div class="sig-role">Disetujui Oleh:</div>
        <div class="sig-date">Tgl: .................................</div>
        <div class="sig-line"></div>
        <div class="sig-name">( ..................................... )</div>
        <div style="font-size:7.5px;color:#64748b">Factory / Departeman Head</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() { 
      setTimeout(function() {
        window.print();
      }, 300);
    };
  <\/script>
</body>
</html>`;

      const win = window.open("", "_blank");
      win.document.write(html);
      win.document.close();
    };

    // --- LOGIKA PENGELOMPOKAN SUB-TAB ADMIN V6 ---
    const todayStr = computed(() => new Date().toISOString().split("T")[0]);

    // Helper untuk mengecek apakah PO sudah Shipped
    const isShippedPO = (po) => {
      if (!po.status) return false;
      const statusLower = po.status.toLowerCase();
      return statusLower.includes("shipped");
    };

    // Helper kecil untuk mendapatkan tanggal acuan shipment (Revisi / Ex-Fty)
    const getEffectiveShipmentDate = (po) => {
      const d = po.revised_ex_fty_date || po.ex_fty_date;
      return d ? d.split("T")[0] : null;
    };

    // 1. ACTIVE
    const activePOsList = computed(() => {
      return items.value.filter((po) => {
        if (isShippedPO(po) || po.status === "Archived") return false;
        const shipDate = getEffectiveShipmentDate(po);
        if (!shipDate) return true;
        return shipDate >= todayStr.value;
      });
    });

    // 2. OVERDUE
    const overduePOsList = computed(() => {
      return items.value.filter((po) => {
        if (isShippedPO(po) || po.status === "Archived") return false;
        const shipDate = getEffectiveShipmentDate(po);
        if (!shipDate) return false;
        return shipDate < todayStr.value;
      });
    });

    // 3. SHIPPED
    const shippedPOsList = computed(() => {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();

      return items.value.filter((po) => {
        if (!isShippedPO(po)) return false;
        if (!po.updated_at) return true;
        const updatedAt = new Date(po.updated_at).getTime();
        return now - updatedAt <= SEVEN_DAYS_MS;
      });
    });

    // 4. ARCHIVE
    const archivedPOsList = computed(() => {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      const now = new Date().getTime();

      return items.value.filter((po) => {
        if (po.status === "Archived") return true;
        if (isShippedPO(po)) {
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

    // Dipakai BulkUploadModal buat nandain di preview kalau PO Number
    // yang mau diimport ternyata udah ada di database.
    const existingPoNumbers = computed(() =>
      items.value.map((po) => po.po_number),
    );

    // Filter PO berdasarkan Tab/Sub-Tab & Filter Interaktif (Search, Buyer, Status, Date)
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
        // --- FILTER TANGGAL SHIPMENT ---
        if (selectedDateFilter.value) {
          const effectiveDate = getEffectiveShipmentDate(po);
          if (effectiveDate !== selectedDateFilter.value) {
            return false;
          }
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
          selectedDateFilter.value ||
          filterUrgentOnly.value
        ),
    );

    return {
      currentUser,
      showLoginModal,
      showUserModal,
      showAuditTrailModal,

      // -- RETURN STATE & FUNGSI BULK UPLOAD PO --
      showBulkUploadModal,
      existingPoNumbers,

      // -- RETURN STATE & FUNGSI V6 --
      showPoDrawer,
      showCartonInModal,
      showCartonOutModal,
      selectedPO,
      openPoDrawer,
      openCartonInModal,
      openCartonOutModal,
      fetchData, // Diekspos agar bisa di-call dari modal sukses

      logout,
      onLoginSuccess,
      isDarkMode,
      activeTab,
      adminSubTab,
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
      selectedDateFilter,
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
