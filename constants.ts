import React from "react";
import {
  Category,
  ReferralOption,
  Wallet,
  SpendingNature,
  AnalyticsWidgetConfig,
  DashboardWidgetConfig,
} from "./types";

export type { ReferralOption };

export const APP_VERSION = "3.0.0";

export const COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#eab308", // Yellow
  "#84cc16", // Lime
  "#10b981", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#0ea5e9", // Sky
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#a855f7", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
];

export const ACCENT_THEMES = [
  { id: "emerald", name: "Emerald", color: "#10b981" },
  { id: "ocean", name: "Ocean", color: "#3b82f6" },
  { id: "purple", name: "Purple", color: "#8b5cf6" },
  { id: "sunset", name: "Sunset", color: "#f97316" },
  { id: "rose", name: "Rose", color: "#f43f5e" },
  { id: "slate", name: "Slate", color: "#64748b" },
];

// Symbols mapped from standard ISO lists
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "United States Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound Sterling" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "dh", name: "United Arab Emirates Dirham" },
  { code: "AFN", symbol: "؋", name: "Afghan Afghani" },
  { code: "ALL", symbol: "L", name: "Albanian Lek" },
  { code: "AMD", symbol: "֏", name: "Armenian Dram" },
  { code: "ANG", symbol: "ƒ", name: "Netherlands Antillean Guilder" },
  { code: "AOA", symbol: "Kz", name: "Angolan Kwanza" },
  { code: "ARS", symbol: "$", name: "Argentine Peso" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "AWG", symbol: "ƒ", name: "Aruban Florin" },
  { code: "AZN", symbol: "₼", name: "Azerbaijani Manat" },
  { code: "BAM", symbol: "KM", name: "Bosnia-Herzegovina Convertible Mark" },
  { code: "BBD", symbol: "$", name: "Barbadian Dollar" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "BHD", symbol: ".د.ب", name: "Bahraini Dinar" },
  { code: "BIF", symbol: "FBu", name: "Burundian Franc" },
  { code: "BMD", symbol: "$", name: "Bermudan Dollar" },
  { code: "BND", symbol: "$", name: "Brunei Dollar" },
  { code: "BOB", symbol: "Bs.", name: "Bolivian Boliviano" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "BSD", symbol: "$", name: "Bahamian Dollar" },
  { code: "BTN", symbol: "Nu.", name: "Bhutanese Ngultrum" },
  { code: "BWP", symbol: "P", name: "Botswanan Pula" },
  { code: "BYN", symbol: "Br", name: "New Belarusian Ruble" },
  { code: "BZD", symbol: "BZ$", name: "Belize Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CDF", symbol: "FC", name: "Congolese Franc" },
  { code: "CHF", symbol: "Fr.", name: "Swiss Franc" },
  { code: "CLP", symbol: "$", name: "Chilean Peso" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "COP", symbol: "$", name: "Colombian Peso" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },
  { code: "CUC", symbol: "$", name: "Cuban Convertible Peso" },
  { code: "CUP", symbol: "₱", name: "Cuban Peso" },
  { code: "CVE", symbol: "$", name: "Cape Verdean Escudo" },
  { code: "CZK", symbol: "Kč", name: "Czech Republic Koruna" },
  { code: "DJF", symbol: "Fdj", name: "Djiboutian Franc" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "DOP", symbol: "RD$", name: "Dominican Peso" },
  { code: "DZD", symbol: "د.ج", name: "Algerian Dinar" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
  { code: "ERN", symbol: "Nfk", name: "Eritrean Nakfa" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "FJD", symbol: "$", name: "Fijian Dollar" },
  { code: "FKP", symbol: "£", name: "Falkland Islands Pound" },
  { code: "GEL", symbol: "₾", name: "Georgian Lari" },
  { code: "GGP", symbol: "£", name: "Guernsey Pound" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  { code: "GIP", symbol: "£", name: "Gibraltar Pound" },
  { code: "GMD", symbol: "D", name: "Gambian Dalasi" },
  { code: "GNF", symbol: "FG", name: "Guinean Franc" },
  { code: "GTQ", symbol: "Q", name: "Guatemalan Quetzal" },
  { code: "GYD", symbol: "$", name: "Guyanaese Dollar" },
  { code: "HKD", symbol: "$", name: "Hong Kong Dollar" },
  { code: "HNL", symbol: "L", name: "Honduran Lempira" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
  { code: "HTG", symbol: "G", name: "Haitian Gourde" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "ILS", symbol: "₪", name: "Israeli New Sheqel" },
  { code: "IMP", symbol: "£", name: "Manx Pound" },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar" },
  { code: "IRR", symbol: "﷼", name: "Iranian Rial" },
  { code: "ISK", symbol: "kr", name: "Icelandic Króna" },
  { code: "JEP", symbol: "£", name: "Jersey Pound" },
  { code: "JMD", symbol: "J$", name: "Jamaican Dollar" },
  { code: "JOD", symbol: "د.ا", name: "Jordanian Dinar" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "KGS", symbol: "с", name: "Kyrgystani Som" },
  { code: "KHR", symbol: "៛", name: "Cambodian Riel" },
  { code: "KMF", symbol: "CF", name: "Comorian Franc" },
  { code: "KPW", symbol: "₩", name: "North Korean Won" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "KYD", symbol: "$", name: "Cayman Islands Dollar" },
  { code: "KZT", symbol: "₸", name: "Kazakhstani Tenge" },
  { code: "LAK", symbol: "₭", name: "Laotian Kip" },
  { code: "LBP", symbol: "ل.ل", name: "Lebanese Pound" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "LRD", symbol: "$", name: "Liberian Dollar" },
  { code: "LSL", symbol: "L", name: "Lesotho Loti" },
  { code: "LYD", symbol: "ل.د", name: "Libyan Dinar" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "MDL", symbol: "L", name: "Moldovan Leu" },
  { code: "MGA", symbol: "Ar", name: "Malagasy Ariary" },
  { code: "MKD", symbol: "ден", name: "Macedonian Denar" },
  { code: "MMK", symbol: "K", name: "Myanma Kyat" },
  { code: "MNT", symbol: "₮", name: "Mongolian Tugrik" },
  { code: "MOP", symbol: "P", name: "Macanese Pataca" },
  { code: "MRU", symbol: "UM", name: "Mauritanian Ouguiya" },
  { code: "MUR", symbol: "₨", name: "Mauritian Rupee" },
  { code: "MVR", symbol: "Rf", name: "Maldivian Rufiyaa" },
  { code: "MWK", symbol: "MK", name: "Malawian Kwacha" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "MZN", symbol: "MT", name: "Mozambican Metical" },
  { code: "NAD", symbol: "$", name: "Namibian Dollar" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "NIO", symbol: "C$", name: "Nicaraguan Córdoba" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "NPR", symbol: "₨", name: "Nepalese Rupee" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  { code: "PAB", symbol: "B/.", name: "Panamanian Balboa" },
  { code: "PEN", symbol: "S/.", name: "Peruvian Nuevo Sol" },
  { code: "PGK", symbol: "K", name: "Papua New Guinean Kina" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "PYG", symbol: "₲", name: "Paraguayan Guarani" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Rial" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "RSD", symbol: "дин.", name: "Serbian Dinar" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "RWF", symbol: "FRw", name: "Rwandan Franc" },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
  { code: "SBD", symbol: "$", name: "Solomon Islands Dollar" },
  { code: "SCR", symbol: "₨", name: "Seychellois Rupee" },
  { code: "SDG", symbol: "£", name: "Sudanese Pound" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "SHP", symbol: "£", name: "Saint Helena Pound" },
  { code: "SLL", symbol: "Le", name: "Sierra Leonean Leone" },
  { code: "SOS", symbol: "Sh", name: "Somali Shilling" },
  { code: "SRD", symbol: "$", name: "Surinamese Dollar" },
  { code: "STN", symbol: "Db", name: "São Tomé and Príncipe Dobra" },
  { code: "SVC", symbol: "$", name: "Salvadoran Colón" },
  { code: "SYP", symbol: "£", name: "Syrian Pound" },
  { code: "SZL", symbol: "L", name: "Swazi Lilangeni" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "TJS", symbol: "SM", name: "Tajikistani Somoni" },
  { code: "TMT", symbol: "T", name: "Turkmenistani Manat" },
  { code: "TND", symbol: "د.ت", name: "Tunisian Dinar" },
  { code: "TOP", symbol: "T$", name: "Tongan Paʻanga" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "TTD", symbol: "TT$", name: "Trinidad and Tobago Dollar" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
  { code: "TZS", symbol: "Sh", name: "Tanzanian Shilling" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso" },
  { code: "UZS", symbol: "лв", name: "Uzbekistan Som" },
  { code: "VES", symbol: "Bs", name: "Venezuelan Bolívar Soberano" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "VUV", symbol: "VT", name: "Vanuatu Vatu" },
  { code: "WST", symbol: "WS$", name: "Samoan Tala" },
  { code: "XAF", symbol: "FCFA", name: "CFA Franc BEAC" },
  { code: "XCD", symbol: "$", name: "East Caribbean Dollar" },
  { code: "XOF", symbol: "CFA", name: "CFA Franc BCEAO" },
  { code: "XPF", symbol: "₣", name: "CFP Franc" },
  { code: "YER", symbol: "﷼", name: "Yemeni Rial" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "ZMW", symbol: "ZK", name: "Zambian Kwacha" },
  { code: "ZWL", symbol: "$", name: "Zimbabwean Dollar" },
  { code: "KID", symbol: "$", name: "Kiribati Dollar" },
  { code: "TVD", symbol: "$", name: "Tuvaluan Dollar" },
].sort((a, b) => a.code.localeCompare(b.code));

export const DEFAULT_CATEGORIES: Category[] = [
  // EXPENSE CATEGORIES
  {
    id: "cat_food",
    name: "Food & Drinks",
    type: "expense",
    icon: "UtensilsCrossed",
    color: "#ef4444", // Red
    subCategories: [
      { id: "sub_groceries", name: "Groceries" },
      { id: "sub_restaurants", name: "Restaurants" },
      { id: "sub_street_food", name: "Street Food" },
      { id: "sub_fast_food", name: "Fast Food" },
      { id: "sub_cafes", name: "Cafés" },
      { id: "sub_snacks", name: "Snacks" },
      { id: "sub_swiggy_zomato", name: "Swiggy / Zomato" },
      { id: "sub_zepto", name: "Zepto" },
      { id: "sub_alcohol", name: "Alcohol" },
      { id: "sub_water", name: "Water" },
    ],
  },
  {
    id: "cat_transport",
    name: "Transport",
    type: "expense",
    icon: "Car",
    color: "#f97316", // Orange
    subCategories: [
      { id: "sub_fuel", name: "Fuel" },
      { id: "sub_cab", name: "Cab" },
      { id: "sub_auto", name: "Auto / Rickshaw" },
      { id: "sub_public_transport", name: "Public Transport" },
      { id: "sub_parking", name: "Parking" },
      { id: "sub_toll", name: "Toll" },
      { id: "sub_vehicle_service", name: "Vehicle Service" },
      { id: "sub_vehicle_insurance", name: "Vehicle Insurance" },
      { id: "sub_vehicle_emi", name: "Vehicle EMI" },
    ],
  },
  {
    id: "cat_housing",
    name: "Housing",
    type: "expense",
    icon: "House",
    color: "#f59e0b", // Amber
    subCategories: [
      { id: "sub_rent", name: "Rent" },
      { id: "sub_society_maintenance", name: "Society / Maintenance" },
      { id: "sub_house_help", name: "House Help" },
      { id: "sub_electricity", name: "Electricity" },
      { id: "sub_water_bill", name: "Water" },
      { id: "sub_gas", name: "Gas" },
      { id: "sub_internet", name: "Internet" },
      { id: "sub_mobile", name: "Mobile" },
      { id: "sub_tv", name: "TV / OTT" },
      { id: "sub_furniture", name: "Furniture" },
      { id: "sub_home_repairs", name: "Home Repairs" },
    ],
  },
  {
    id: "cat_shopping",
    name: "Shopping",
    type: "expense",
    icon: "ShoppingBag",
    color: "#eab308", // Yellow
    subCategories: [
      { id: "sub_clothes", name: "Clothes" },
      { id: "sub_footwear", name: "Footwear" },
      { id: "sub_accessories", name: "Accessories" },
      { id: "sub_electronics", name: "Electronics" },
      { id: "sub_home_items", name: "Home Items" },
      { id: "sub_online_shopping", name: "Online Shopping" },
      { id: "sub_gifts_exp", name: "Gifts" },
    ],
  },
  {
    id: "cat_health",
    name: "Health",
    type: "expense",
    icon: "Activity",
    color: "#84cc16", // Lime
    subCategories: [
      { id: "sub_doctor", name: "Doctor" },
      { id: "sub_medicines", name: "Medicines" },
      { id: "sub_lab_tests", name: "Lab Tests" },
      { id: "sub_hospital", name: "Hospital" },
      { id: "sub_health_insurance", name: "Health Insurance" },
      { id: "sub_gym", name: "Gym" },
      { id: "sub_therapy", name: "Therapy" },
      { id: "sub_supplements", name: "Supplements" },
    ],
  },
  {
    id: "cat_education",
    name: "Education",
    type: "expense",
    icon: "GraduationCap",
    color: "#10b981", // Green
    subCategories: [
      { id: "sub_school", name: "School" },
      { id: "sub_college", name: "College" },
      { id: "sub_coaching", name: "Coaching" },
      { id: "sub_books", name: "Books" },
      { id: "sub_online_courses", name: "Online Courses" },
      { id: "sub_exams", name: "Exams" },
      { id: "sub_edu_subscriptions", name: "Subscriptions" },
    ],
  },
  {
    id: "cat_entertainment",
    name: "Entertainment",
    type: "expense",
    icon: "Clapperboard",
    color: "#14b8a6", // Teal
    subCategories: [
      { id: "sub_movies", name: "Movies" },
      { id: "sub_games", name: "Games" },
      { id: "sub_music", name: "Music" },
      { id: "sub_events", name: "Events" },
      { id: "sub_ent_subscriptions", name: "Subscriptions" },
      { id: "sub_sports", name: "Sports" },
      { id: "sub_trips", name: "Trips" },
      { id: "sub_hobbies", name: "Hobbies" },
    ],
  },
  {
    id: "cat_bills",
    name: "Bills & Utilities",
    type: "expense",
    icon: "ReceiptText",
    color: "#06b6d4", // Cyan
    subCategories: [
      { id: "sub_bill_electricity", name: "Electricity" },
      { id: "sub_bill_water", name: "Water" },
      { id: "sub_bill_gas", name: "Gas" },
      { id: "sub_bill_internet", name: "Internet" },
      { id: "sub_bill_mobile", name: "Mobile" },
      { id: "sub_cc_bill", name: "Credit Card Bill" },
      { id: "sub_loan_emi", name: "Loan EMI" },
      { id: "sub_app_subs", name: "App Subscriptions" },
    ],
  },
  {
    id: "cat_fees",
    name: "Fees & Charges",
    type: "expense",
    icon: "BadgePercent",
    color: "#0ea5e9", // Sky
    subCategories: [
      { id: "sub_bank_fees", name: "Bank Fees" },
      { id: "sub_atm_charges", name: "ATM Charges" },
      { id: "sub_late_fee", name: "Late Fee" },
      { id: "sub_interest_paid", name: "Interest Paid" },
      { id: "sub_penalty", name: "Penalty" },
      { id: "sub_tax", name: "Tax" },
    ],
  },
  {
    id: "cat_lifestyle",
    name: "Personal & Lifestyle",
    type: "expense",
    icon: "User",
    color: "#3b82f6", // Blue
    subCategories: [
      { id: "sub_grooming", name: "Grooming" },
      { id: "sub_beauty", name: "Beauty" },
      { id: "sub_salon", name: "Salon" },
      { id: "sub_dating", name: "Dating" },
      { id: "sub_donations", name: "Donations" },
      { id: "sub_pets", name: "Pets" },
      { id: "sub_spiritual", name: "Spiritual" },
    ],
  },

  // INCOME CATEGORIES
  {
    id: "cat_salary",
    name: "Salary",
    type: "income",
    icon: "BriefcaseBusiness",
    color: "#10b981", // Green
  },
  {
    id: "cat_freelance",
    name: "Freelance",
    type: "income",
    icon: "LaptopMinimal",
    color: "#06b6d4", // Cyan
  },
  {
    id: "cat_business",
    name: "Business",
    type: "income",
    icon: "Store",
    color: "#3b82f6", // Blue
  },
  {
    id: "cat_interest",
    name: "Interest",
    type: "income",
    icon: "Percent",
    color: "#8b5cf6", // Violet
  },
  {
    id: "cat_cashback",
    name: "Cashback",
    type: "income",
    icon: "RotateCcw",
    color: "#f59e0b", // Amber
  },
  {
    id: "cat_bonus",
    name: "Bonus",
    type: "income",
    icon: "HandCoins",
    color: "#ec4899", // Pink
  },
  {
    id: "cat_rent_inc",
    name: "Rent Received",
    type: "income",
    icon: "House",
    color: "#6366f1", // Indigo
  },
  {
    id: "cat_refund",
    name: "Refund",
    type: "income",
    icon: "CornerDownLeft",
    color: "#84cc16", // Lime
  },
  {
    id: "cat_gift",
    name: "Gifts",
    type: "income",
    icon: "Gift",
    color: "#d946ef", // Fuchsia
  },
  {
    id: "cat_investment",
    name: "Investment Income",
    type: "income",
    icon: "TrendingUp",
    color: "#0ea5e9", // Sky
    subCategories: [
      { id: "sub_stock_div", name: "Stock Dividends" },
      { id: "sub_mutual_fund", name: "Mutual Fund Returns" },
      { id: "sub_fd_interest", name: "FD Interest" },
      { id: "sub_crypto", name: "Crypto Gains" },
      { id: "sub_rental_yield", name: "Rental Yield" },
      { id: "sub_cap_gains", name: "Capital Gains" },
    ],
  },
  {
    id: "cat_scrap",
    name: "Scrap",
    type: "income",
    icon: "Recycle",
    color: "#64748b", // Slate
  },
  {
    id: "cat_other_income",
    name: "Other Income",
    type: "income",
    icon: "PlusCircle",
    color: "#a855f7", // Purple
    subCategories: [
      { id: "sub_prize", name: "Prize" },
      { id: "sub_scholarship", name: "Scholarship" },
      { id: "sub_govt_benefit", name: "Government Benefit" },
      { id: "sub_ins_payout", name: "Insurance Payout" },
    ],
  },

  // System
  {
    id: "cat_transfer",
    name: "Transfer",
    type: "transfer",
    icon: "ArrowRightLeft",
    color: "#64748b", // Slate (System color, kept as is or could be Gray)
  },
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: "wallet_cash",
    name: "Cash",
    type: "cash",
    balance: 0,
    color: "#10b981",
    icon: "Wallet",
    createdAt: new Date().toISOString(),
  },
];

// ── Spending Nature Mapping ──────────────────────────────────────────
// Maps category IDs → default spending nature (Must / Need / Want)
export const SPENDING_NATURE_MAP: Record<string, SpendingNature> = {
  // Must — unavoidable critical expenses
  cat_housing: "must",
  cat_bills: "must",
  cat_fees: "must",

  // Need — important but adjustable
  cat_food: "need",
  cat_transport: "need",
  cat_health: "need",
  cat_education: "need",

  // Want — discretionary spending
  cat_shopping: "want",
  cat_entertainment: "want",
  cat_lifestyle: "want",
};

// ── Default Analytics Widgets ────────────────────────────────────────
export const ANALYTICS_WIDGET_DEFAULTS: AnalyticsWidgetConfig[] = [
  { id: "financialHealthScore", enabled: true, order: 1 },
  { id: "summaryCards", enabled: true, order: 2 },
  { id: "categoryDistribution", enabled: true, order: 3 },
  { id: "expensesOverTime", enabled: true, order: 4 },
  { id: "incomeVsExpense", enabled: true, order: 5 },
  { id: "spendingHeatmap", enabled: true, order: 6 },
  { id: "mustNeedWant", enabled: true, order: 7 },
  { id: "spendingByDay", enabled: true, order: 8 },
  { id: "budgetCompliance", enabled: true, order: 9 },
  { id: "dailyAverageSpend", enabled: true, order: 10 },
  { id: "subcategoryBreakdown", enabled: true, order: 11 },
  { id: "netWorthTrend", enabled: true, order: 12 },
  { id: "savingsGoalsProgress", enabled: true, order: 13 },
  { id: "walletDistribution", enabled: true, order: 14 },
  { id: "categoryTrend", enabled: true, order: 15 },
  { id: "largestExpense", enabled: true, order: 16 },
  { id: "transactionFrequency", enabled: true, order: 17 },
  { id: "smallPurchaseLeak", enabled: true, order: 18 },
  { id: "subscriptionOverview", enabled: true, order: 19 },
  { id: "spendingPersonality", enabled: true, order: 20 },
  { id: "smartInsights", enabled: true, order: 21 },
];

// ── Global Onboarding Referral Options ────────────────────────────────
export const ONBOARDING_REFERRAL_OPTIONS: ReferralOption[] = [
  {
    id: "search_engine",
    text: "Search",
    iconName: "Globe",
    colorClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
    chartColor: "bg-blue-500",
    chartBg: "bg-blue-50 dark:bg-blue-950/20",
    chartText: "text-blue-700 dark:text-blue-400"
  },
  {
    id: "friend_family",
    text: "Friend / Family",
    iconName: "Users",
    colorClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    chartColor: "bg-emerald-500",
    chartBg: "bg-emerald-50 dark:bg-emerald-950/20",
    chartText: "text-emerald-700 dark:text-emerald-400"
  },
  {
    id: "social_media",
    text: "Social media",
    iconName: "Smartphone",
    colorClass: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
    chartColor: "bg-purple-500",
    chartBg: "bg-purple-50 dark:bg-purple-950/20",
    chartText: "text-purple-700 dark:text-purple-400"
  },
  {
    id: "youtube",
    text: "YouTube",
    iconName: "Play",
    colorClass: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
    chartColor: "bg-rose-500",
    chartBg: "bg-rose-50 dark:bg-rose-950/20",
    chartText: "text-rose-700 dark:text-rose-400"
  },
  {
    id: "online_community",
    text: "Community / Forum",
    iconName: "MessageSquare",
    colorClass: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30",
    chartColor: "bg-indigo-500",
    chartBg: "bg-indigo-50 dark:bg-indigo-950/20",
    chartText: "text-indigo-700 dark:text-indigo-400"
  },
  {
    id: "blog_review",
    text: "Blog / Article",
    iconName: "BookOpen",
    colorClass: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    chartColor: "bg-amber-500",
    chartBg: "bg-amber-50 dark:bg-amber-950/20",
    chartText: "text-amber-700 dark:text-amber-400"
  },
  {
    id: "educational",
    text: "School / Project",
    iconName: "GraduationCap",
    colorClass: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30",
    chartColor: "bg-cyan-500",
    chartBg: "bg-cyan-50 dark:bg-cyan-950/20",
    chartText: "text-cyan-700 dark:text-cyan-400"
  },
  {
    id: "work_productivity",
    text: "Work",
    iconName: "Briefcase",
    colorClass: "text-teal-600 bg-teal-50 dark:bg-teal-950/30",
    chartColor: "bg-teal-500",
    chartBg: "bg-teal-50 dark:bg-teal-950/20",
    chartText: "text-teal-700 dark:text-teal-400"
  },
  {
    id: "app_directory",
    text: "App Directory",
    iconName: "Smartphone",
    colorClass: "text-sky-600 bg-sky-50 dark:bg-sky-950/30",
    chartColor: "bg-sky-500",
    chartBg: "bg-sky-50 dark:bg-sky-950/20",
    chartText: "text-sky-700 dark:text-sky-400"
  },
  {
    id: "ai_assistant",
    text: "AI Assistant",
    iconName: "Bot",
    colorClass: "text-violet-600 bg-violet-50 dark:bg-violet-950/30",
    chartColor: "bg-violet-500",
    chartBg: "bg-violet-50 dark:bg-violet-950/20",
    chartText: "text-violet-700 dark:text-violet-400"
  },
  {
    id: "household_invite",
    text: "Household member invited me",
    iconName: "Home",
    colorClass: "text-pink-600 bg-pink-50 dark:bg-pink-950/30",
    chartColor: "bg-pink-500",
    chartBg: "bg-pink-50 dark:bg-pink-950/20",
    chartText: "text-pink-700 dark:text-pink-400"
  },
  {
    id: "shared_budgeity",
    text: "Shared using Budgeity",
    iconName: "Share2",
    colorClass: "text-lime-600 bg-lime-50 dark:bg-lime-950/30",
    chartColor: "bg-lime-500",
    chartBg: "bg-lime-50 dark:bg-lime-950/20",
    chartText: "text-lime-700 dark:text-lime-400"
  },
  {
    id: "just_exploring",
    text: "Just exploring budgeting apps",
    iconName: "Sparkles",
    colorClass: "text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/30",
    chartColor: "bg-fuchsia-500",
    chartBg: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    chartText: "text-fuchsia-700 dark:text-fuchsia-400"
  },
  {
    id: "other",
    text: "Other",
    iconName: "HelpCircle",
    colorClass: "text-slate-600 bg-slate-100 dark:bg-zinc-800/40",
    chartColor: "bg-slate-500",
    chartBg: "bg-slate-100 dark:bg-zinc-800",
    chartText: "text-slate-700 dark:text-zinc-400"
  }
];

export const DASHBOARD_WIDGET_DEFAULTS: DashboardWidgetConfig[] = [
  { id: "networth", enabled: true, order: 1 },
  { id: "income_expense", enabled: true, order: 2 },
  { id: "snapshot", enabled: true, order: 3 },
  { id: "wallets", enabled: true, order: 4 },
  { id: "trend", enabled: true, order: 5 },
  { id: "goals", enabled: true, order: 6 },
  { id: "transactions", enabled: true, order: 7 },
  { id: "spending", enabled: false, order: 8 },
  { id: "budgets", enabled: false, order: 9 },
  { id: "actions", enabled: false, order: 10 },
  { id: "planned", enabled: false, order: 11 },
  { id: "subscriptions", enabled: true, order: 12 },
  { id: "forecast", enabled: false, order: 13 },
];

// ── SVG Social & Auth Icons (React.createElement for pure .ts file compatibility) ──
export const WhatsAppIcon = ({ size = 24 }: { size?: number }) =>
  React.createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement("path", {
      d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
    })
  );

export const TelegramIcon = ({ size = 24 }: { size?: number }) =>
  React.createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 192 192", fill: "none" },
    React.createElement("path", {
      stroke: "currentColor",
      strokeWidth: "12",
      d: "M23.073 88.132s65.458-26.782 88.16-36.212c8.702-3.772 38.215-15.843 38.215-15.843s13.621-5.28 12.486 7.544c-.379 5.281-3.406 23.764-6.433 43.756-4.54 28.291-9.459 59.221-9.459 59.221s-.756 8.676-7.188 10.185c-6.433 1.509-17.027-5.281-18.919-6.79-1.513-1.132-28.377-18.106-38.214-26.404-2.649-2.263-5.676-6.79.378-12.071 13.621-12.447 29.891-27.913 39.728-37.72 4.54-4.527 9.081-15.089-9.837-2.264-26.864 18.483-53.35 35.835-53.35 35.835s-6.053 3.772-17.404.377c-11.351-3.395-24.594-7.921-24.594-7.921s-9.08-5.659 6.433-11.693Z"
    })
  );

export const XIcon = ({ size = 20 }: { size?: number }) =>
  React.createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement("path", {
      d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"
    })
  );

export const GoogleIcon = (props: any) => {
  const size = props.size || 20;
  return React.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: size, height: size, ...props },
    React.createElement("path", {
      d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
      fill: "#4285F4"
    }),
    React.createElement("path", {
      d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
      fill: "#34A853"
    }),
    React.createElement("path", {
      d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z",
      fill: "#FBBC05"
    }),
    React.createElement("path", {
      d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
      fill: "#EA4335"
    })
  );
};

export const GithubIcon = (props: any) => {
  const size = props.size || 20;
  return React.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: size, height: size, fill: "currentColor", ...props },
    React.createElement("path", {
      d: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
    })
  );
};

export const FacebookIcon = (props: any) => {
  const size = props.size || 20;
  return React.createElement(
    "svg",
    { viewBox: "0 0 24 24", width: size, height: size, fill: "#1877F2", ...props },
    React.createElement("path", {
      d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    })
  );
};

