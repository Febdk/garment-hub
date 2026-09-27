// Semua fungsi di sini murni (pure) — logikanya identik dengan file asli,
// cuma dipindah supaya bisa dipakai bareng-bareng oleh beberapa komponen.

// Tampilkan HANYA waktu yang tersimpan (bukan "baru saja")
export const formatDateTime = (dtStr) => {
  if (!dtStr) return "-";
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Logika kritikal/urgent: status inspeksi aktif ATAU H-2/H-1/Hari H/overdue
export const isUrgentPO = (po) => {
  if (po.status === "Inspection Internal" || po.status === "Inspection External") {
    return true;
  }

  const shipDateStr = po.revised_ex_fty_date || po.ex_fty_date;
  if (shipDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shipDate = new Date(shipDateStr);
    shipDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((shipDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) return true;
  }

  return false;
};

// Teks indikator urgensi (dipakai di panel kritikal)
export const getUrgencyBadgeText = (po) => {
  const shipDateStr = po.revised_ex_fty_date || po.ex_fty_date;
  if (!shipDateStr) return "Kritikal";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shipDate = new Date(shipDateStr);
  shipDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((shipDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Overdue (${Math.abs(diffDays)} hari lewat)`;
  if (diffDays === 0) return "HARI H SHIPMENT";
  if (diffDays === 1) return "H-1 Shipment";
  if (diffDays === 2) return "H-2 Shipment";
  return "Urgent Inspeksi";
};

// Label buyer — kelas ".tag" (kartu label karton, tenang & satu baris)
export const getBuyerBadgeClass = (buyer) => {
  const b = (buyer || "").toLowerCase();
  if (b.includes("polo")) return "tag text-sky-700 dark:text-sky-300";
  if (b.includes("hugo")) return "tag text-ink-900 dark:text-paper-50";
  if (b.includes("lululemon")) return "tag text-alarm-600 dark:text-alarm-300";
  if (b.includes("tommy")) return "tag text-indigo-700 dark:text-indigo-300";
  if (b.includes("rhone")) return "tag text-stamp-600 dark:text-stamp-300";
  if (b.includes("brooks")) return "tag text-hazard-700 dark:text-hazard-300";
  if (b.includes("bean")) return "tag text-emerald-700 dark:text-emerald-300";
  return "tag text-ink-500 dark:text-ink-300";
};

// Status PO — kelas ".stamp" (stempel QC, tegas & sedikit miring)
export const getStatusBadge = (status) => {
  if (status === "Shipped / Exported") return "stamp text-ink-400 dark:text-ink-400";
  if (status === "Ready to Ship") return "stamp text-stamp-600 dark:text-stamp-300";
  if (status === "Inspection External") return "stamp text-sky-600 dark:text-sky-300";
  if (status === "Inspection Internal") return "stamp text-indigo-600 dark:text-indigo-300";
  return "stamp text-hazard-600 dark:text-hazard-400"; // Pending (default)
};
