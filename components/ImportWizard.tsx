import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useData } from "../context/DataContext";
import { X, Upload, Check, AlertCircle, Download } from "lucide-react";
import { cn, generateId, parseExcelDate } from "../utils";
import CustomSelect from "./CustomSelect";
import { Transaction, Wallet, Category } from "../types";

interface Props {
  onClose: () => void;
  targetWalletId: string; // can be 'all'
}

const ImportWizard: React.FC<Props> = ({ onClose, targetWalletId }) => {
  const { importData, categories, wallets, formatAmount, addCategory } =
    useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState({
    date: "",
    amount: "",
    description: "",
    type: "",
    category: "",
    subCategory: "",
    wallet: "",
  });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [walletsToCreate, setWalletsToCreate] = useState<string[]>([]);
  const [categoriesToCreate, setCategoriesToCreate] = useState<string[]>([]);

  // Step 1: File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length > 0) {
        const detectedHeaders = data[0].map((h: any) => String(h));
        setHeaders(detectedHeaders);
        const rawRows = data.slice(1);
        setRawData(rawRows);

        // Smart Mapping Logic
        const newMapping = { ...mapping };
        const lowerHeaders = detectedHeaders.map((h) => h.toLowerCase());

        const findMatch = (keywords: string[]) => {
          return (
            detectedHeaders.find((h) =>
              keywords.some((k) => h.toLowerCase().includes(k)),
            ) || ""
          );
        };

        // Date
        newMapping.date = findMatch(["date", "time", "day", "when"]);

        // Amount
        newMapping.amount = findMatch([
          "amount",
          "value",
          "sum",
          "cost",
          "price",
          "total",
        ]);

        // Description
        newMapping.description = findMatch([
          "desc",
          "note",
          "memo",
          "detail",
          "narrat",
          "particular",
          "ref",
        ]);

        // Category
        newMapping.category = findMatch(["cat", "group"]);

        // SubCategory
        newMapping.subCategory = findMatch(["sub", "detail"]);

        // Type
        newMapping.type = findMatch(["type", "drcr", "crdr", "kind"]);

        // Wallet
        newMapping.wallet = findMatch(["wallet", "account", "bank", "source"]);

        setMapping(newMapping);
        setStep(2);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleMappingChange = (field: keyof typeof mapping, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const processImport = () => {
    if (!mapping.date || !mapping.amount) return;

    const dateIdx = headers.indexOf(mapping.date);
    const amountIdx = headers.indexOf(mapping.amount);
    const descIdx = headers.indexOf(mapping.description);
    const typeIdx = headers.indexOf(mapping.type);
    const catIdx = headers.indexOf(mapping.category);
    const subCatIdx = headers.indexOf(mapping.subCategory);
    const walletIdx = headers.indexOf(mapping.wallet);

    let defaultWallet = wallets[0]?.id;
    if (targetWalletId !== "all") defaultWallet = targetWalletId;

    const newWalletNames = new Set<string>();

    const processed = rawData
      .map((row) => {
        if (!row[dateIdx] || row[amountIdx] === undefined) return null;

        let amount = parseFloat(row[amountIdx]);
        if (isNaN(amount)) return null;

        let type: "income" | "expense" = "expense";
        const desc = row[descIdx] ? String(row[descIdx]) : "";

        let walletNameFromRow = "";
        if (walletIdx !== -1 && row[walletIdx]) {
          walletNameFromRow = String(row[walletIdx]).trim();
        }

        // Check Type
        if (typeIdx !== -1 && row[typeIdx]) {
          const tStr = String(row[typeIdx]).toLowerCase();
          if (
            tStr.includes("inc") ||
            tStr.includes("dep") ||
            tStr.includes("add") ||
            tStr.includes("credit")
          )
            type = "income";
          else if (
            tStr.includes("exp") ||
            tStr.includes("pay") ||
            tStr.includes("withd") ||
            tStr.includes("debit")
          )
            type = "expense";
          else if (tStr.includes("transf")) type = "transfer" as any;
        }

        // Auto-detect type based on sign if not explicit
        if (amount < 0 && type !== ("transfer" as any)) {
          type = "expense";
          amount = Math.abs(amount);
        }

        // Category Matching Logic
        let finalCategoryId = categories[0].id;
        let finalSubCategoryId: string | undefined = undefined;

        // Helper to match category
        const matchCategory = (catInput: string, subInput?: string) => {
          const mainStr = catInput.trim().toLowerCase();
          const subStr = subInput?.trim().toLowerCase();

          // 1. Try to find main category
          let mainCat = categories.find(
            (c) => c.name.toLowerCase() === mainStr,
          );

          // Fallback: If no subInput but mainStr has parentheses, parse it (backward compatibility)
          if (
            !mainCat &&
            !subStr &&
            mainStr.includes("(") &&
            mainStr.includes(")")
          ) {
            const parts = mainStr.match(/^([^(]+)\s*\(([^)]+)\)$/);
            if (parts) {
              const pMain = parts[1].trim();
              const pSub = parts[2].trim();
              mainCat = categories.find((c) => c.name.toLowerCase() === pMain);
              if (mainCat) {
                const sub = mainCat.subCategories?.find(
                  (s) => s.name.toLowerCase() === pSub,
                );
                if (sub) return { catId: mainCat.id, subId: sub.id };
                return { catId: mainCat.id, createSub: pSub };
              }
              return { createMain: pMain, createSub: pSub };
            }
          }

          if (mainCat) {
            if (subStr) {
              const sub = mainCat.subCategories?.find(
                (s) => s.name.toLowerCase() === subStr,
              );
              if (sub) return { catId: mainCat.id, subId: sub.id };
              return { catId: mainCat.id, createSub: subStr };
            }
            return { catId: mainCat.id };
          }

          // Fuzzy Match as fallback
          const fuzzyMatch = categories.find(
            (c) =>
              c.name.toLowerCase().includes(mainStr) ||
              mainStr.includes(c.name.toLowerCase()),
          );
          if (fuzzyMatch) return { catId: fuzzyMatch.id };

          return { createMain: catInput, createSub: subInput };
        };

        const catVal = catIdx !== -1 ? String(row[catIdx] || "") : "";
        const subCatVal = subCatIdx !== -1 ? String(row[subCatIdx] || "") : "";

        if (catVal) {
          const res = matchCategory(catVal, subCatVal);
          if (res) {
            if (res.createMain) {
              const uniqueKey = res.createSub
                ? `${res.createMain}|${res.createSub}`
                : res.createMain;
              finalCategoryId = `NEW_CAT:${uniqueKey}`;
            } else if (res.createSub) {
              // Main exists, sub doesn't
              const mainCatName = categories.find(
                (c) => c.id === res.catId,
              )?.name;
              finalCategoryId = `NEW_CAT:${mainCatName}|${res.createSub}`;
            } else {
              finalCategoryId = res.catId!;
              finalSubCategoryId = res.subId;
            }
          }
        } else if (descIdx !== -1) {
          const res = matchCategory(desc);
          if (res && !res.createMain) {
            finalCategoryId = res.catId!;
            finalSubCategoryId = res.subId;
          }
        }

        // Determine Wallet Logic
        let finalWalletId = defaultWallet;
        let finalToWalletId: string | null = null;

        if (walletNameFromRow) {
          // Check for "From -> To" format for transfers
          if (walletNameFromRow.includes("->")) {
            const [fromStr, toStr] = walletNameFromRow
              .split("->")
              .map((s) => s.trim());

            // Find From Wallet
            const fromW = wallets.find(
              (w) => w.name.toLowerCase() === fromStr.toLowerCase(),
            );
            if (fromW) finalWalletId = fromW.id;
            else if (targetWalletId === "all") {
              newWalletNames.add(fromStr); // newWalletNames is a Set
              finalWalletId = `NEW:${fromStr}`;
            }

            // Find To Wallet
            const toW = wallets.find(
              (w) => w.name.toLowerCase() === toStr.toLowerCase(),
            );
            if (toW) finalToWalletId = toW.id;
            else if (targetWalletId === "all") {
              newWalletNames.add(toStr);
              finalToWalletId = `NEW:${toStr}`;
            }

            if (type !== "income" && type !== "expense")
              type = "transfer" as any;
          } else {
            // Standard Single Wallet
            const existing = wallets.find(
              (w) => w.name.toLowerCase() === walletNameFromRow.toLowerCase(),
            );
            if (existing) {
              finalWalletId = existing.id;
            } else if (targetWalletId === "all") {
              newWalletNames.add(walletNameFromRow);
              finalWalletId = `NEW:${walletNameFromRow}`;
            }
          }
        }

        // Date Parsing using helper
        const dateStr = parseExcelDate(row[dateIdx]);

        // Construct Result
        if ((type as any) === "transfer") {
          return {
            amount: Math.abs(amount),
            type: "transfer",
            date: dateStr,
            note: desc,
            fromWalletId: finalWalletId, // In "From -> To", first is From
            toWalletId: finalToWalletId || defaultWallet, // Fallback if parsing failed but type is transfer
            categoryId: "cat_transfer",
            subCategoryId: undefined,
            _tempCat: undefined, // Helper prop
          };
        }

        return {
          amount: Math.abs(amount),
          type,
          date: dateStr,
          note: desc,
          fromWalletId: type === "expense" ? finalWalletId : null,
          toWalletId: type === "income" ? finalWalletId : null,
          categoryId: finalCategoryId,
          subCategoryId: finalSubCategoryId,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    // Extract New Wallets to Create
    const newWallets = new Set<string>();
    processed.forEach((p) => {
      if (p.fromWalletId?.startsWith("NEW:"))
        newWallets.add(p.fromWalletId.replace("NEW:", ""));
      if (p.toWalletId?.startsWith("NEW:"))
        newWallets.add(p.toWalletId.replace("NEW:", ""));
    });
    setWalletsToCreate(Array.from(newWallets));

    // Extract New Categories to Create
    const newCats = new Set<string>();
    processed.forEach((p) => {
      if (p.categoryId?.startsWith("NEW_CAT:"))
        newCats.add(p.categoryId.replace("NEW_CAT:", ""));
    });
    setCategoriesToCreate(Array.from(newCats));

    setPreviewData(processed);
    setStep(3);
  };

  const confirmImport = () => {
    // 1. Prepare new wallets with actual IDs
    const newWalletsMap = new Map<string, Wallet>();
    const newWalletsList: Wallet[] = [];

    walletsToCreate.forEach((name) => {
      const newId = generateId();
      const w: Wallet = {
        id: newId,
        name,
        type: "cash",
        balance: 0, // Balance will be calculated by importData logic
        color: "#64748b",
        createdAt: new Date().toISOString(),
      };
      newWalletsMap.set(name, w);
      newWalletsList.push(w);
    });

    // 2. Prepare New Categories
    const newCatsMap = new Map<string, string>(); // 'Main|Sub' -> ID
    const newCatsList: Category[] = [];

    // We need to group by Main Category to handle subcategories correctly
    const catGroups = new Map<string, Set<string>>(); // MainName -> Set<SubName>

    categoriesToCreate.forEach((key) => {
      const [main, sub] = key.split("|");
      if (!catGroups.has(main)) catGroups.set(main, new Set());
      if (sub) catGroups.get(main)?.add(sub);
    });

    catGroups.forEach((subSet, mainName) => {
      // Check if main category already exists (it shouldn't if we're here, but double check)
      // Actually it might exist if we are adding a NEW SUB-category to an EXISTING Main
      let mainCat = categories.find(
        (c) => c.name.toLowerCase() === mainName.toLowerCase(),
      );

      if (!mainCat) {
        // Create New Main Category
        mainCat = {
          id: generateId(),
          name: mainName,
          type: "expense", // Default
          icon: "Circle",
          color: "#94a3b8",
          subCategories: [],
        };
        // Add to list to be created
        newCatsList.push(mainCat);
      }

      // Add subcategories
      subSet.forEach((subName) => {
        const subId = generateId();
        if (!mainCat!.subCategories) mainCat!.subCategories = [];
        mainCat!.subCategories.push({ id: subId, name: subName });

        // Map for transaction lookup
        newCatsMap.set(`${mainName}|${subName}`, `${mainCat!.id}|${subId}`);
      });

      // Map for main category lookup
      newCatsMap.set(mainName, mainCat!.id);
    });

    // 3. Fix temp IDs in processed transaction data
    const finalTransactions: Transaction[] = previewData.map((t, i) => {
      let from = t.fromWalletId;
      let to = t.toWalletId;
      let cat = t.categoryId;
      let subCat = t.subCategoryId;

      // Wallets
      if (from && from.startsWith("NEW:")) {
        const name = from.replace("NEW:", "");
        from = newWalletsMap.get(name)?.id || wallets[0].id;
      }
      if (to && to.startsWith("NEW:")) {
        const name = to.replace("NEW:", "");
        to = newWalletsMap.get(name)?.id || wallets[0].id;
      }

      // Categories
      if (cat && cat.startsWith("NEW_CAT:")) {
        const key = cat.replace("NEW_CAT:", "");
        const [main, sub] = key.split("|");

        if (sub) {
          // Mapped as "MainId|SubId"
          const ids = newCatsMap.get(key);
          if (ids) {
            const [mId, sId] = ids.split("|");
            cat = mId;
            subCat = sId;
          }
        } else {
          cat = newCatsMap.get(main) || categories[0].id;
        }
      }

      return {
        ...t,
        id: `${Date.now()}-${i}`,
        fromWalletId: from,
        toWalletId: to,
        categoryId: cat,
        subCategoryId: subCat,
        createdBy: "Import",
      };
    });

    // 4. Update Global State
    importData(newWalletsList, finalTransactions, newCatsList);
    onClose();
  };

  // Convert headers to SelectOptions
  const headerOptions = [
    { value: "", label: "Select Column..." },
    ...headers.map((h) => ({ value: h, label: h })),
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl relative z-10 p-6 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Import Transactions</h2>
            <button onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {/* Steps Indicator */}
            <div className="flex items-center justify-center mb-8 text-sm">
              <div
                className={cn(
                  "flex items-center gap-2",
                  step >= 1 ? "text-brand-600 font-bold" : "text-slate-400",
                )}
              >
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-current">
                  1
                </div>{" "}
                Upload
              </div>
              <div className="w-10 h-0.5 bg-slate-200 mx-2" />
              <div
                className={cn(
                  "flex items-center gap-2",
                  step >= 2 ? "text-brand-600 font-bold" : "text-slate-400",
                )}
              >
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-current">
                  2
                </div>{" "}
                Map
              </div>
              <div className="w-10 h-0.5 bg-slate-200 mx-2" />
              <div
                className={cn(
                  "flex items-center gap-2",
                  step >= 3 ? "text-brand-600 font-bold" : "text-slate-400",
                )}
              >
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-current">
                  3
                </div>{" "}
                Confirm
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div
                  className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="font-medium text-lg">
                    Click to upload CSV or Excel
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    Supports .csv, .xlsx, .xls
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const headers = [
                        "Date",
                        "Amount",
                        "Description",
                        "Category",
                        "Subcategory",
                        "Type (income/expense)",
                        "Wallet",
                      ];
                      const examples = [
                        [
                          "2024-02-15",
                          "50.00",
                          "Grocery Shopping",
                          "Food",
                          "Groceries",
                          "expense",
                          "Cash",
                        ],
                        [
                          "2024-02-16",
                          "1200.00",
                          "Salary",
                          "Salary",
                          "",
                          "income",
                          "Bank",
                        ],
                        [
                          "2024-02-17",
                          "15.50",
                          "Coffee with friends",
                          "Entertainment",
                          "Dining Out",
                          "expense",
                          "Cash",
                        ],
                      ];

                      const csvRows = [headers.join(",")];
                      examples.forEach((row) => csvRows.push(row.join(",")));

                      const csvContent =
                        "data:text/csv;charset=utf-8," + csvRows.join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute(
                        "download",
                        "budgeity_import_template.csv",
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-2"
                  >
                    <Download size={16} /> Download Import Template
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-slate-500">
                  Map the columns. We try to auto-detect categories!
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Date", key: "date", req: true },
                    { label: "Amount", key: "amount", req: true },
                    { label: "Description", key: "description", req: false },
                    { label: "Category", key: "category", req: false },
                    { label: "Subcategory", key: "subCategory", req: false },
                    { label: "Type (Inc/Exp)", key: "type", req: false },
                    {
                      label: "Wallet Name",
                      key: "wallet",
                      req: targetWalletId === "all",
                    },
                  ].map((field) => (
                    <div key={field.key}>
                      <CustomSelect
                        label={`${field.label} ${field.req ? "*" : ""}`}
                        value={mapping[field.key as keyof typeof mapping]}
                        onChange={(val) =>
                          handleMappingChange(
                            field.key as keyof typeof mapping,
                            val,
                          )
                        }
                        options={headerOptions}
                      />
                    </div>
                  ))}
                </div>
                {targetWalletId === "all" && (
                  <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-xl flex gap-3 text-brand-800 dark:text-brand-200 text-sm">
                    <AlertCircle size={20} className="shrink-0" />
                    <span>
                      If a wallet name in the file doesn't exist, we will create
                      it automatically!
                    </span>
                  </div>
                )}
                <button
                  onClick={processImport}
                  disabled={
                    !mapping.date ||
                    !mapping.amount ||
                    (targetWalletId === "all" && !mapping.wallet)
                  }
                  className="w-full py-3 bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold hover:bg-brand-700"
                >
                  Preview Import
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">
                  Preview ({previewData.length} items)
                </h3>

                {walletsToCreate.length > 0 && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-200">
                    <strong>{walletsToCreate.length} new wallets</strong> will
                    be created: {walletsToCreate.join(", ")}
                  </div>
                )}

                {categoriesToCreate.length > 0 && (
                  <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-xl border border-blue-200">
                    <strong>{categoriesToCreate.length} new categories</strong>{" "}
                    will be created:{" "}
                    {categoriesToCreate
                      .map((c) => c.replace("|", " > "))
                      .join(", ")}
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-zinc-800 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-500 sticky top-0">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Note</th>
                        <th className="p-2">Cat.</th>
                        <th className="p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => {
                        const catName =
                          categories.find((c) => c.id === row.categoryId)
                            ?.name || "Uncat.";
                        return (
                          <tr
                            key={i}
                            className="border-t border-slate-100 dark:border-zinc-800"
                          >
                            <td className="p-2 whitespace-nowrap">
                              {new Date(row.date).toLocaleDateString()}
                            </td>
                            <td className="p-2 truncate max-w-[100px]">
                              {row.note}
                            </td>
                            <td className="p-2 truncate max-w-[80px]">
                              {catName}
                            </td>
                            <td
                              className={cn(
                                "p-2 font-medium",
                                row.type === "income"
                                  ? "text-emerald-600"
                                  : "text-rose-600",
                              )}
                            >
                              {formatAmount(row.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={confirmImport}
                  className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 flex items-center justify-center gap-2"
                >
                  <Check size={20} /> Confirm Import
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
