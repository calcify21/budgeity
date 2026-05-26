import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import CustomDatePicker from "../components/CustomDatePicker";
import { useData } from "../context/DataContext";
import { Download, FileSpreadsheet, FileText, Table } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { formatCurrency, formatDate } from "../utils";
import CustomSelect from "../components/CustomSelect";
import LOGO_BASE64 from "../utils/logoBase64";

const Export: React.FC = () => {
  const { t } = useTranslation();
  const { transactions, wallets, categories, currency } = useData();

  // Filters
  const [walletFilter, setWalletFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const getFilteredData = () => {
    return transactions
      .filter((t) => {
        // Type
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        // Wallet
        if (walletFilter !== "all") {
          if (t.type === "transfer") {
            if (
              t.fromWalletId !== walletFilter &&
              t.toWalletId !== walletFilter
            )
              return false;
          } else {
            const wId = t.type === "income" ? t.toWalletId : t.fromWalletId;
            if (wId !== walletFilter) return false;
          }
        }
        // Date
        if (dateFrom && new Date(t.date) < new Date(dateFrom)) return false;
        if (dateTo) {
          const d = new Date(dateTo);
          d.setHours(23, 59, 59);
          if (new Date(t.date) > d) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getRowData = (t: any) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    const subCat = cat?.subCategories?.find(
      (s) => s.id === t.subCategoryId,
    )?.name;

    const wName = (id: string | null) =>
      wallets.find((w) => w.id === id)?.name || "-";

    let walletStr = "-";
    if (t.type === "income") walletStr = wName(t.toWalletId);
    else if (t.type === "expense") walletStr = wName(t.fromWalletId);
    else walletStr = `${wName(t.fromWalletId)} -> ${wName(t.toWalletId)}`;

    let rawAmount = t.amount;
    if (t.type === "expense") {
      rawAmount = -t.amount;
    } else if (t.type === "transfer" && walletFilter !== "all") {
      if (t.fromWalletId === walletFilter) rawAmount = -t.amount;
    }

    return {
      Date: formatDate(t.date),
      Type: t.type.toUpperCase(),
      Category:
        t.type === "transfer" ? "Transfer" : cat?.name || "Uncategorized",
      Subcategory: subCat || "",
      Wallet: walletStr,
      Note: t.note,
      Amount: t.amount,
      RawAmount: rawAmount,
    };
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const formatPDFMoney = (amount: number) => {
      const num = new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return `${currency} ${num}`;
    };

    const data = getFilteredData();
    const tableData = data.map((t) => {
      const row = getRowData(t);
      return [
        row.Date,
        row.Type,
        row.Category,
        row.Subcategory,
        row.Wallet,
        row.Note,
        formatPDFMoney(t.amount),
      ];
    });

    // Add Branding Header
    doc.setFillColor(34, 197, 94); // Brand Green
    doc.rect(0, 0, 210, 20, "F");

    // Add Logo
    try {
      doc.addImage(LOGO_BASE64, "PNG", 14, 4, 12, 12);
    } catch (e) {
      console.error("Error drawing logo", e);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Budgeity", 28, 13);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("Transaction Report", 14, 35);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 42);
    if (dateFrom || dateTo)
      doc.text(`Period: ${dateFrom || "Start"} to ${dateTo || "End"}`, 14, 47);

    const income = data
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);
    const expense = data
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Total Income: ${formatPDFMoney(income)}`, 14, 58);
    doc.text(`Total Expense: ${formatPDFMoney(expense)}`, 14, 65);
    doc.text(`Net: ${formatPDFMoney(income - expense)}`, 14, 72);

    autoTable(doc, {
      startY: 80,
      head: [
        ["Date", "Type", "Category", "Subcategory", "Wallet", "Note", "Amount"],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        5: { cellWidth: "auto" }, // Note
        6: { cellWidth: 30, halign: "right" },
      },
    });

    doc.save("budgeity_report.pdf");
  };

  const exportExcel = () => {
    const data = getFilteredData();
    const rows = data.map((t) => {
      const r = getRowData(t);
      return {
        Date: r.Date,
        Type: r.Type,
        Category: r.Category,
        Subcategory: r.Subcategory,
        Wallet: r.Wallet,
        Note: r.Note,
        Amount: r.RawAmount,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns for better look
    const max_width = rows.reduce(
      (w, r) => Math.max(w, r.Note?.length || 0),
      10,
    );
    ws["!cols"] = [
      { wch: 15 }, // Date
      { wch: 10 }, // Type
      { wch: 20 }, // Category
      { wch: 20 }, // Subcategory
      { wch: 20 }, // Wallet
      { wch: max_width }, // Note
      { wch: 15 }, // Amount
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "budgeity_export.xlsx");
  };

  const exportCSV = () => {
    const data = getFilteredData();
    const rows = data.map((t) => {
      const r = getRowData(t);
      return {
        Date: r.Date,
        Type: r.Type,
        Category: r.Category,
        Subcategory: r.Subcategory,
        Wallet: r.Wallet,
        Note: r.Note,
        Amount: r.RawAmount,
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "budgeity_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("export.title")}</h2>
      </div>



      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h3 className="font-semibold text-lg tour-export-config">
          {t("export.reportConfiguration")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CustomDatePicker
              value={dateFrom}
              onChange={setDateFrom}
              label={t("export.dateFrom")}
              className="bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-700"
            />
          </div>
          <div>
            <CustomDatePicker
              value={dateTo}
              onChange={setDateTo}
              label={t("export.dateTo")}
              className="bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-700"
            />
          </div>
          <div>
            <CustomSelect
              label={t("common.wallet")}
              value={walletFilter}
              onChange={setWalletFilter}
              options={[
                { value: "all", label: "All Wallets" },
                ...wallets.map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>
          <div>
            <CustomSelect
              label={t("export.transactionType")}
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All Types" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "transfer", label: "Transfer" },
              ]}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
          <h3 className="font-semibold text-lg mb-4">
            {t("export.exportFormat")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tour-export-actions">
            <button
              onClick={exportPDF}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors border border-transparent hover:border-red-200 group"
            >
              <FileText
                size={32}
                className="mb-2 text-slate-400 group-hover:text-inherit"
              />
              <span className="font-bold">{t("export.pdfDocument")}</span>
            </button>
            <button
              onClick={exportExcel}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors border border-transparent hover:border-emerald-200 group"
            >
              <FileSpreadsheet
                size={32}
                className="mb-2 text-slate-400 group-hover:text-inherit"
              />
              <span className="font-bold">{t("export.excelXlsx")}</span>
            </button>
            <button
              onClick={exportCSV}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-800 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-200 group"
            >
              <Table
                size={32}
                className="mb-2 text-slate-400 group-hover:text-inherit"
              />
              <span className="font-bold">{t("export.csvFile")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;
