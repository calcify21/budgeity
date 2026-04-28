import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as LucideIcons from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ICON_MAP: Record<string, any> = {};

Object.keys(LucideIcons).forEach((key) => {
  if (
    key[0] === key[0].toUpperCase() &&
    typeof (LucideIcons as any)[key] === "object" &&
    !key.endsWith("Icon") &&
    !key.startsWith("Lucide") &&
    key !== "createLucideIcon" &&
    key !== "icons" &&
    key !== "default"
  ) {
    ICON_MAP[key] = (LucideIcons as any)[key];
  }
});

export const ICON_CATEGORIES = [
  {
    name: "Finance & Shopping",
    keywords: [
      "dollar",
      "euro",
      "pound",
      "rupee",
      "bank",
      "coin",
      "wallet",
      "credit",
      "card",
      "receipt",
      "shopping",
      "bag",
      "cart",
      "store",
      "percent",
      "tag",
      "gift",
      "piggy",
    ],
  },
  {
    name: "Food & Beverage",
    keywords: [
      "coffee",
      "pizza",
      "beer",
      "wine",
      "glass",
      "water",
      "utensil",
      "cake",
      "citrus",
      "beef",
      "soup",
      "icecream",
      "fish",
      "ham",
      "sandwich",
      "cooking",
      "apple",
      "carrot",
      "food",
    ],
  },
  {
    name: "Transport & Travel",
    keywords: [
      "car",
      "bus",
      "truck",
      "train",
      "plane",
      "ship",
      "bike",
      "anchor",
      "ticket",
      "map",
      "compass",
      "navigation",
      "luggage",
      "baggage",
      "tram",
      "cable",
    ],
  },
  {
    name: "Home & Tools",
    keywords: [
      "house",
      "home",
      "building",
      "hammer",
      "wrench",
      "tool",
      "paint",
      "door",
      "window",
      "bed",
      "bath",
      "shower",
      "sofa",
      "lamp",
    ],
  },
  {
    name: "Electronics & Media",
    keywords: [
      "phone",
      "smartphone",
      "laptop",
      "monitor",
      "tv",
      "camera",
      "music",
      "video",
      "film",
      "headphones",
      "mic",
      "speaker",
      "battery",
      "plug",
      "printer",
      "keyboard",
      "mouse",
    ],
  },
  {
    name: "Nature & Weather",
    keywords: [
      "sun",
      "moon",
      "cloud",
      "rain",
      "snow",
      "wind",
      "storm",
      "tree",
      "leaf",
      "flower",
      "flame",
      "droplet",
      "mountain",
      "wave",
      "star",
    ],
  },
  {
    name: "Health & Fitness",
    keywords: [
      "heart",
      "activity",
      "dumbbell",
      "pill",
      "stethoscope",
      "bandage",
      "cross",
      "syringe",
      "brain",
      "smile",
      "person",
      "user",
      "users",
      "baby",
    ],
  },
  {
    name: "Animals",
    keywords: [
      "dog",
      "cat",
      "bird",
      "fish",
      "paw",
      "rabbit",
      "turtle",
      "snail",
      "bug",
    ],
  },
  {
    name: "Office & UI",
    keywords: [
      "file",
      "folder",
      "document",
      "clipboard",
      "mail",
      "inbox",
      "calendar",
      "clock",
      "pen",
      "pencil",
      "book",
      "bookmark",
      "trash",
      "settings",
      "gear",
      "search",
      "zoom",
    ],
  },
  {
    name: "Miscellaneous",
    keywords: [],
  },
];

export function categorizeIcons(icons: string[]) {
  const categorized: Record<string, string[]> = {};
  ICON_CATEGORIES.forEach((c) => (categorized[c.name] = []));

  icons.forEach((icon) => {
    const lowerIcon = icon.toLowerCase();
    let matched = false;

    for (const category of ICON_CATEGORIES) {
      if (category.name === "Miscellaneous") continue;

      if (category.keywords.some((kw) => lowerIcon.includes(kw))) {
        categorized[category.name].push(icon);
        matched = true;
        break;
      }
    }

    if (!matched) {
      categorized["Miscellaneous"].push(icon);
    }
  });

  Object.keys(categorized).forEach((key) => {
    if (categorized[key].length === 0) delete categorized[key];
  });

  return categorized;
}

export const formatCurrency = (
  amount: number,
  currency = "USD",
  hide = false,
  locale = "en-US",
) => {
  if (hide) return "••••••";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export const formatAmountInWords = (
  amount: number,
  system: "IN" | "INTL" | "AUTO" = "AUTO",
  currency: string = "USD",
): string => {
  if (amount === 0) return "Zero";
  if (isNaN(amount)) return "Not a Number";
  if (!isFinite(amount)) return "Infinity";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0 || isNaN(n) || !isFinite(n)) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const one = n % 10;
    if (n < 100) return `${tens[ten]} ${ones[one]}`.trim();
    return `${ones[Math.floor(n / 100)]} Hundred ${convertLessThanOneThousand(n % 100)}`.trim();
  };

  const formatIndian = (num: number): string => {
    if (num === 0 || isNaN(num) || !isFinite(num)) return "";
    if (num < 1000) return convertLessThanOneThousand(num);
    const scaleValues = [
      { v: 100000000000000000, n: "Shankh" },
      { v: 1000000000000000, n: "Padma" },
      { v: 10000000000000, n: "Neel" },
      { v: 100000000000, n: "Kharab" },
      { v: 1000000000, n: "Arab" },
      { v: 10000000, n: "Crore" },
      { v: 100000, n: "Lakh" },
      { v: 1000, n: "Thousand" },
    ];

    for (const scale of scaleValues) {
      if (num >= scale.v) {
        const quotient = Math.floor(num / scale.v);
        const remainder = num % scale.v;
        let res = `${formatIndian(quotient)} ${scale.n} `;
        if (remainder > 0) res += formatIndian(remainder);
        return res.trim();
      }
    }
    return convertLessThanOneThousand(num);
  };

  const formatIntl = (num: number): string => {
    if (num === 0 || isNaN(num) || !isFinite(num)) return "";
    if (num < 1000) return convertLessThanOneThousand(num);
    const scaleValues = [
      { v: 1000000000000000000, n: "Quintillion" },
      { v: 1000000000000000, n: "Quadrillion" },
      { v: 1000000000000, n: "Trillion" },
      { v: 1000000000, n: "Billion" },
      { v: 1000000, n: "Million" },
      { v: 1000, n: "Thousand" },
    ];

    for (const scale of scaleValues) {
      if (num >= scale.v) {
        const quotient = Math.floor(num / scale.v);
        const remainder = num % scale.v;
        let res = `${formatIntl(quotient)} ${scale.n} `;
        if (remainder > 0) res += formatIntl(remainder);
        return res.trim();
      }
    }
    return convertLessThanOneThousand(num);
  };

  const indianCurrencies = ["INR", "PKR", "BDT", "NPR", "LKR"];
  const useIndianSystem =
    system === "IN" ||
    (system === "AUTO" && indianCurrencies.includes(currency));

  let integerPart = Math.floor(Math.abs(amount));

  let result = "";

  if (useIndianSystem) {
    result = formatIndian(integerPart);
  } else {
    result = formatIntl(integerPart);
  }

  result = result.trim();
  if (!result) result = "Zero";

  return result;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const parseExcelDate = (value: any): string => {
  if (!value) return new Date().toISOString();

  // Helper to set time to Noon (12:00) to avoid timezone shifts
  const setNoon = (d: Date) => {
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  };

  // If it's a number (Excel Serial Date)
  // Excel base date is Dec 30, 1899 usually
  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return setNoon(date);
  }

  // Try standard parse
  const date = new Date(value);
  if (!isNaN(date.getTime())) return setNoon(date);

  return new Date().toISOString(); // Fallback
};

// Safe Math Evaluator for Calculator Input
export const evaluateExpression = (expression: string): number => {
  // 1. Replace custom operators and remove non-math characters
  const sanitized = expression
    .replace(/[xX×]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[^0-9+\-*/().]/g, "");

  // 2. Return 0 if empty
  if (!sanitized) return 0;

  try {
    // 3. Use Function constructor for safe evaluation (safer than direct eval, but still restricted by sanitization)
    // We strictly sanitized inputs, so this is minimal risk.
    const result = new Function(`return (${sanitized})`)();

    // 4. Validate result
    if (!isFinite(result) || isNaN(result)) return 0;

    // 5. Round to 2 decimals to avoid floating point errors
    return Math.round(result * 100) / 100;
  } catch (e) {
    return 0; // Return 0 on syntax error (e.g. "5+")
  }
};

// Date Helpers for Budgets
export const isDateInPeriod = (
  dateStr: string,
  period: "weekly" | "monthly" | "custom",
  customStart?: string,
  customEnd?: string,
) => {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return false; // Early return for invalid date
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (period === "monthly") {
    return (
      target.getMonth() === now.getMonth() &&
      target.getFullYear() === now.getFullYear()
    );
  }

  if (period === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const nextSunday = new Date(monday);
    nextSunday.setDate(monday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    // Reset target for comparison
    const t = new Date(dateStr);
    return t >= monday && t <= nextSunday;
  }

  if (period === "custom" && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    const t = new Date(dateStr);
    return t >= start && t <= end;
  }

  return false;
};

export const getCategoryIcon = (iconName: string) => {
  return ICON_MAP[iconName] || LucideIcons.Circle;
};
