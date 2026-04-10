/**
 * reportsPdf.ts
 * Professional 8-page PDF report generator for Budgeity.
 * Uses jsPDF + jspdf-autotable for structured output.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LOGO_BASE64 from "./logoBase64";
import type {
  PerformanceData,
  CashFlowData,
  BudgetData,
  ForecastData,
  SmartInsight,
} from "./reportsEngine";
import type { Goal } from "../types";

// ── Colors ──────────────────────────────────────────────────────────

const BRAND = [34, 197, 94] as [number, number, number]; // #22c55e
const DARK = [15, 23, 42] as [number, number, number]; // #0f172a
const GRAY = [100, 116, 139] as [number, number, number]; // #64748b
const LIGHT_BG = [248, 250, 252] as [number, number, number]; // #f8fafc
const RED = [244, 63, 94] as [number, number, number]; // #f43f5e
const EMERALD = [16, 185, 129] as [number, number, number]; // #10b981
const INDIGO = [99, 102, 241] as [number, number, number]; // #6366f1
const AMBER = [245, 158, 11] as [number, number, number]; // #f59e0b

// ── Helpers ─────────────────────────────────────────────────────────

const fmt = (amount: number, currency: string): string => {
  try {
    // Use plain number formatting to avoid Unicode currency symbols that break jsPDF
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
    // Prefix with simple currency code
    return `${currency} ${formatted}`;
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
};

// Strip non-ASCII characters that break jsPDF's built-in Helvetica encoding
const sanitize = (text: string): string => {
  return text
    // Replace common Unicode currency symbols with ASCII abbreviations
    .replace(/[\u20B9]/g, "Rs. ") // ₹
    .replace(/[\u20AC]/g, "EUR ") // €
    .replace(/[\u00A3]/g, "GBP ") // £
    .replace(/[\u00A5]/g, "JPY ") // ¥
    // Remove any remaining non-printable / non-ASCII chars
    .replace(/[^\x20-\x7E]/g, "")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
};

const pct = (value: number): string => `${value.toFixed(1)}%`;

const addPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(`Budgeity Financial Report`, 14, pageHeight - 10);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, pageHeight - 10, {
    align: "right",
  });
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
};

const addSectionHeader = (
  doc: jsPDF,
  title: string,
  y: number,
): number => {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(title, 14, y);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(1);
  doc.line(14, y + 2, 14 + doc.getTextWidth(title), y + 2);
  return y + 12;
};

const addStatBox = (
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  color: [number, number, number] = DARK,
) => {
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(x, y, width, 22, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(label, x + 5, y + 8);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color);
  doc.text(sanitize(value), x + 5, y + 18);
};

// ── Main Generator ──────────────────────────────────────────────────

interface ReportPdfParams {
  performance: PerformanceData;
  cashFlow: CashFlowData;
  budget: BudgetData;
  forecast: ForecastData;
  insights: SmartInsight[];
  goals: Goal[];
  monthLabel: string;
  currency: string;
  userName?: string;
  formatAmount: (amount: number) => string;
}

// Add a branded page header with logo to every content page
const addPageHeader = (doc: jsPDF, pageWidth: number) => {
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 12, "F");
  // Small logo in corner
  try {
    doc.addImage(LOGO_BASE64, "PNG", pageWidth - 24, 14, 10, 10);
  } catch (e) {
    // Silently fail if logo errors
  }
};

export const generateFullReport = (params: ReportPdfParams) => {
  const {
    performance,
    cashFlow,
    budget,
    forecast,
    insights,
    goals,
    monthLabel,
    currency,
    userName,
    formatAmount,
  } = params;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const totalPages = 8;

  // Create a PDF-safe amount formatter
  const fmtAmt = (amount: number) => sanitize(fmt(amount, currency));

  // ─── PAGE 1: COVER ─────────────────────────────────────────────

  // Full-page brand header
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, 297, "F");

  // Logo
  try {
    doc.addImage(LOGO_BASE64, "PNG", pageWidth / 2 - 15, 60, 30, 30);
  } catch (e) {
    console.error("Logo error", e);
  }

  // App name
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Budgeity", pageWidth / 2, 110, { align: "center" });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Monthly Financial Report", pageWidth / 2, 125, {
    align: "center",
  });

  // Month
  doc.setFontSize(20);
  doc.setTextColor(...BRAND);
  doc.text(monthLabel, pageWidth / 2, 150, { align: "center" });

  // User name
  if (userName) {
    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184);
    doc.text(`Prepared for: ${userName}`, pageWidth / 2, 170, {
      align: "center",
    });
  }

  // Generated date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    pageWidth / 2,
    200,
    { align: "center" },
  );

  // Decorative line
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 30, 135, pageWidth / 2 + 30, 135);

  addPageFooter(doc, 1, totalPages);

  // ─── PAGE 2: SUMMARY OVERVIEW ─────────────────────────────────

  doc.addPage();
  let y = 25;

  // Header bar with logo
  addPageHeader(doc, pageWidth);

  y = addSectionHeader(doc, "Summary Overview", y);

  // Stat boxes - row 1
  const boxW = (pageWidth - 42) / 3;
  addStatBox(doc, "Total Income", fmtAmt(performance.currentTotals.income), 14, y, boxW, EMERALD);
  addStatBox(doc, "Total Expense", fmtAmt(performance.currentTotals.expense), 14 + boxW + 7, y, boxW, RED);
  addStatBox(doc, "Net Savings", fmtAmt(performance.currentTotals.savings), 14 + (boxW + 7) * 2, y, boxW, performance.currentTotals.savings >= 0 ? INDIGO : RED);
  y += 30;

  // Stat boxes - row 2
  addStatBox(doc, "Savings Rate", pct(performance.currentTotals.savingsRate), 14, y, boxW, INDIGO);
  addStatBox(doc, "Expense Ratio", pct(performance.currentTotals.expenseRatio), 14 + boxW + 7, y, boxW, AMBER);
  addStatBox(doc, "Efficiency Score", `${performance.efficiencyScore}/100`, 14 + (boxW + 7) * 2, y, boxW, BRAND);
  y += 35;

  // Smart insights
  y = addSectionHeader(doc, "Key Insights", y);
  insights.forEach((insight, i) => {
    const icon = insight.type === "positive" ? "+" : insight.type === "negative" ? "!" : ">";
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(`${icon}  ${sanitize(insight.text)}`, 18, y + i * 10);
  });
  y += insights.length * 10 + 10;

  // Period comparison
  y = addSectionHeader(doc, "Period Comparison", y);
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Current Month", "Previous Month", "Change"]],
    body: [
      [
        "Income",
        fmtAmt(performance.currentTotals.income),
        fmtAmt(performance.previousTotals.income),
        `${performance.previousTotals.income > 0 ? (((performance.currentTotals.income - performance.previousTotals.income) / performance.previousTotals.income) * 100).toFixed(1) : "N/A"}%`,
      ],
      [
        "Expenses",
        fmtAmt(performance.currentTotals.expense),
        fmtAmt(performance.previousTotals.expense),
        `${performance.previousTotals.expense > 0 ? (((performance.currentTotals.expense - performance.previousTotals.expense) / performance.previousTotals.expense) * 100).toFixed(1) : "N/A"}%`,
      ],
      [
        "Savings",
        fmtAmt(performance.currentTotals.savings),
        fmtAmt(performance.previousTotals.savings),
        `${pct(performance.savingsChange)}`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold", fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 3: { halign: "right" } },
  });

  addPageFooter(doc, 2, totalPages);

  // ─── PAGE 3: PERFORMANCE ANALYSIS ─────────────────────────────

  doc.addPage();
  addPageHeader(doc, pageWidth);
  y = addSectionHeader(doc, "Performance Analysis", 25);

  // Category comparison table
  const catTableData = performance.categoryComparisons.slice(0, 12).map((c) => [
    c.name,
    fmtAmt(c.current),
    fmtAmt(c.previous),
    `${c.change > 0 ? "+" : ""}${c.change}%`,
  ]);

  if (catTableData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Category", "Current Month", "Previous Month", "Change"]],
      body: catTableData,
      theme: "striped",
      headStyles: { fillColor: DARK, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 3) {
          const val = parseFloat(data.cell.raw as string);
          if (!isNaN(val)) {
            data.cell.styles.textColor = val > 0 ? RED : val < 0 ? EMERALD : GRAY;
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  y = (doc as any).lastAutoTable?.finalY + 15 || y + 15;

  // Highlights
  if (performance.highlights.length > 0) {
    y = addSectionHeader(doc, "Key Highlights", y);
    performance.highlights.forEach((h, i) => {
      const prefix = h.type === "increase" ? "^" : h.type === "decrease" ? "v" : ">";
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...DARK);
      doc.text(`${prefix}  ${h.label}: ${sanitize(h.category)}`, 18, y + i * 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(`(${fmtAmt(h.amount)})`, 140, y + i * 8);
    });
    y += performance.highlights.length * 8 + 10;
  }

  // Savings Efficiency
  y = addSectionHeader(doc, "Savings Efficiency", y);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND);
  doc.text(`${performance.efficiencyScore}%`, 18, y + 5);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("of income saved this month", 55, y + 5);

  addPageFooter(doc, 3, totalPages);

  // ─── PAGE 4: CASH FLOW ANALYSIS ───────────────────────────────

  doc.addPage();
  addPageHeader(doc, pageWidth);
  y = addSectionHeader(doc, "Cash Flow Analysis", 25);

  // Flow summary stats
  const flowBoxW = (pageWidth - 35) / 3;
  addStatBox(doc, "Total Inflow", fmtAmt(cashFlow.totalInflow), 14, y, flowBoxW, EMERALD);
  addStatBox(doc, "Total Outflow", fmtAmt(cashFlow.totalOutflow), 14 + flowBoxW + 3.5, y, flowBoxW, RED);
  addStatBox(doc, "Net Flow", fmtAmt(cashFlow.netFlow), 14 + (flowBoxW + 3.5) * 2, y, flowBoxW, cashFlow.netFlow >= 0 ? INDIGO : RED);
  y += 35;

  // Income breakdown table
  if (cashFlow.incomeSources.length > 0) {
    y = addSectionHeader(doc, "Income Sources", y);
    autoTable(doc, {
      startY: y,
      head: [["Source", "Amount", "Share"]],
      body: cashFlow.incomeSources.map((s) => [
        s.name,
        fmtAmt(s.amount),
        pct(s.percentage),
      ]),
      theme: "striped",
      headStyles: { fillColor: EMERALD, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable?.finalY + 12 || y + 12;
  }

  // Expense breakdown table
  if (cashFlow.expenseFlows.length > 0) {
    y = addSectionHeader(doc, "Expense Breakdown", y);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount", "Share"]],
      body: cashFlow.expenseFlows.slice(0, 10).map((e) => [
        e.name,
        fmtAmt(e.amount),
        pct(e.percentage),
      ]),
      theme: "striped",
      headStyles: { fillColor: RED, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
  }

  addPageFooter(doc, 4, totalPages);

  // ─── PAGE 5: BUDGET ANALYSIS ──────────────────────────────────

  doc.addPage();
  addPageHeader(doc, pageWidth);
  y = addSectionHeader(doc, "Budget Analysis", 25);

  // Discipline score
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(14, y, pageWidth - 28, 30, 4, 4, "F");
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  const isNoBudget = budget.disciplineScore === -1;

  if (isNoBudget) {
    doc.setTextColor(...GRAY);
    doc.text("N/A", 24, y + 20);
    doc.setFontSize(10);
    doc.text(`  •  ${budget.disciplineLabel}`, 48, y + 20);
  } else {
    const scoreColor =
      budget.disciplineScore >= 80 ? EMERALD : budget.disciplineScore >= 60 ? AMBER : RED;
    doc.setTextColor(...scoreColor);
    doc.text(`${budget.disciplineScore}`, 24, y + 20);
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(`/ 100  •  ${budget.disciplineLabel}`, 48, y + 20);
  }
  doc.setFontSize(8);
  doc.text(
    `${budget.categoriesWithinBudget}/${budget.totalCategories} categories within budget  •  ${budget.daysUnderSafeSpend}/${budget.totalDays} days under safe spend`,
    24,
    y + 28,
  );
  y += 40;

  // Budget vs Actual table
  if (budget.budgetVsActual.length > 0) {
    y = addSectionHeader(doc, "Budget vs Actual", y);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Budgeted", "Actual", "Remaining", "Status"]],
      body: budget.budgetVsActual.map((b) => [
        b.categoryName,
        fmtAmt(b.budgeted),
        fmtAmt(b.actual),
        fmtAmt(b.remaining),
        b.status === "over"
          ? "Over Budget"
          : b.status === "near"
            ? "Near Limit"
            : "Under Budget",
      ]),
      theme: "striped",
      headStyles: { fillColor: DARK, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          const val = data.cell.raw as string;
          if (val === "Over Budget") {
            data.cell.styles.textColor = RED;
            data.cell.styles.fontStyle = "bold";
          } else if (val === "Near Limit") {
            data.cell.styles.textColor = AMBER;
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = EMERALD;
          }
        }
      },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("No budgets configured. Create budgets to track spending discipline.", 18, y);
  }

  addPageFooter(doc, 5, totalPages);

  // ─── PAGE 6: FORECAST ─────────────────────────────────────────

  doc.addPage();
  addPageHeader(doc, pageWidth);
  y = addSectionHeader(doc, "Forecast & Projections", 25);

  // Monthly averages
  const avgBoxW = (pageWidth - 35) / 3;
  addStatBox(doc, "Avg Monthly Income", fmtAmt(forecast.monthlyAvgIncome), 14, y, avgBoxW, EMERALD);
  addStatBox(doc, "Avg Monthly Expense", fmtAmt(forecast.monthlyAvgExpense), 14 + avgBoxW + 3.5, y, avgBoxW, RED);
  addStatBox(doc, "Avg Monthly Savings", fmtAmt(forecast.monthlyAvgSavings), 14 + (avgBoxW + 3.5) * 2, y, avgBoxW, forecast.monthlyAvgSavings >= 0 ? INDIGO : RED);
  y += 35;

  // Projections table
  y = addSectionHeader(doc, "Net Worth Projection", y);
  const projTableData = forecast.netWorthProjection
    .filter((p) => p.isProjected)
    .map((p) => [
      p.month,
      fmtAmt(p.value),
      p.isProjected ? "Projected" : "Actual",
    ]);

  if (projTableData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Month", "Projected Net Worth", "Type"]],
      body: projTableData,
      theme: "striped",
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 1: { halign: "right" } },
    });
    y = (doc as any).lastAutoTable?.finalY + 15 || y + 15;
  }

  // Forecast summary
  y = addSectionHeader(doc, "Forecast Summary", y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);

  const summaryLines = doc.splitTextToSize(sanitize(forecast.forecastSummary), pageWidth - 36);
  doc.text(summaryLines, 18, y);

  addPageFooter(doc, 6, totalPages);

  // ─── PAGE 7: INSIGHTS & OBSERVATIONS ──────────────────────────

  doc.addPage();
  addPageHeader(doc, pageWidth);
  y = addSectionHeader(doc, "Insights & Observations", 25);

  // Spending patterns
  y = addSectionHeader(doc, "Spending Patterns", y);
  const patterns: string[] = [];

  if (performance.categoryComparisons.length > 0) {
    const top = performance.categoryComparisons[0];
    patterns.push(`Your highest spending category is ${top.name} at ${fmtAmt(top.current)}.`);
  }

  const increasing = performance.categoryComparisons.filter((c) => c.change > 15);
  if (increasing.length > 0) {
    patterns.push(
      `Categories with significant increases: ${increasing.map((c) => `${c.name} (+${c.change}%)`).join(", ")}.`,
    );
  }

  const decreasing = performance.categoryComparisons.filter((c) => c.change < -15);
  if (decreasing.length > 0) {
    patterns.push(
      `Categories with notable decreases: ${decreasing.map((c) => `${c.name} (${c.change}%)`).join(", ")}.`,
    );
  }

  if (cashFlow.netFlow > 0) {
    patterns.push(`Your cash flow is positive, indicating good financial health.`);
  } else {
    patterns.push(`Your cash flow is negative. Consider reducing discretionary spending.`);
  }

  patterns.forEach((p, i) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(`*  ${p}`, 18, y + i * 10);
  });
  y += patterns.length * 10 + 15;

  // Warnings
  const warnings: string[] = [];
  const overBudget = budget.budgetVsActual.filter((b) => b.status === "over");
  if (overBudget.length > 0) {
    warnings.push(
      `${overBudget.length} budget${overBudget.length > 1 ? "s" : ""} exceeded: ${overBudget.map((b) => b.categoryName).join(", ")}.`,
    );
  }
  if (performance.currentTotals.savingsRate < 10) {
    warnings.push(`Your savings rate is below 10%. Consider setting savings goals.`);
  }
  if (forecast.monthlyAvgSavings < 0) {
    warnings.push(`Your average monthly expenses exceed income. This is unsustainable long-term.`);
  }

  if (warnings.length > 0) {
    y = addSectionHeader(doc, "Warnings", y);
    warnings.forEach((w, i) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...RED);
      doc.text(`!  ${w}`, 18, y + i * 10);
    });
    y += warnings.length * 10 + 15;
  }

  // Improvements
  const improvements: string[] = [];
  if (performance.currentTotals.savingsRate >= 20) {
    improvements.push(`Excellent savings rate! Consider investing surplus for long-term growth.`);
  }
  if (budget.disciplineScore >= 80) {
    improvements.push(`Your budget discipline is strong. Keep maintaining these habits.`);
  }
  if (decreasing.length > 0) {
    improvements.push(`Great job reducing spending in ${decreasing.length} categor${decreasing.length > 1 ? "ies" : "y"}.`);
  }

  if (improvements.length > 0) {
    y = addSectionHeader(doc, "Improvements", y);
    improvements.forEach((imp, i) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...EMERALD);
      doc.text(`+  ${imp}`, 18, y + i * 10);
    });
  }

  addPageFooter(doc, 7, totalPages);

  // ─── PAGE 8: GOALS & PROGRESS ─────────────────────────────────

  doc.addPage();
  addPageHeader(doc, pageWidth);
  y = addSectionHeader(doc, "Goals & Progress", 25);

  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");

  if (activeGoals.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Goal", "Target", "Current", "Progress", "Status"]],
      body: activeGoals.map((g) => {
        const progress =
          g.targetAmount > 0
            ? Math.min(100, (g.currentBalance / g.targetAmount) * 100)
            : 0;
        return [
          g.name,
          fmtAmt(g.targetAmount),
          fmtAmt(g.currentBalance),
          `${progress.toFixed(1)}%`,
          progress >= 100
            ? "Achieved"
            : progress >= 50
              ? "On Track"
              : "In Progress",
        ];
      }),
      theme: "striped",
      headStyles: { fillColor: INDIGO, textColor: 255, fontStyle: "bold", fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          const val = data.cell.raw as string;
          if (val === "Achieved") data.cell.styles.textColor = EMERALD;
          else if (val === "On Track") data.cell.styles.textColor = INDIGO;
          else data.cell.styles.textColor = AMBER;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable?.finalY + 15 || y + 15;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text("No active savings goals. Create goals to track your progress.", 18, y);
    y += 15;
  }

  // Achieved goals summary
  if (achievedGoals.length > 0) {
    y = addSectionHeader(doc, "Achieved Goals", y);
    achievedGoals.forEach((g, i) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...EMERALD);
      doc.text(`*  ${g.name} -- ${fmtAmt(g.targetAmount)}`, 18, y + i * 8);
    });
    y += achievedGoals.length * 8 + 15;
  }

  // Summary footer
  const totalGoalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalGoalCurrent = activeGoals.reduce((s, g) => s + g.currentBalance, 0);
  if (totalGoalTarget > 0) {
    y += 5;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(14, y, pageWidth - 28, 20, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(
      `Total Goal Progress: ${fmtAmt(totalGoalCurrent)} / ${fmtAmt(totalGoalTarget)} (${((totalGoalCurrent / totalGoalTarget) * 100).toFixed(1)}%)`,
      pageWidth / 2,
      y + 12,
      { align: "center" },
    );
  }

  addPageFooter(doc, 8, totalPages);

  // ─── SAVE ─────────────────────────────────────────────────────

  const fileName = `Budgeity_Report_${monthLabel.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};
