import {
  Category,
  Wallet,
  SpendingNature,
  AnalyticsWidgetConfig,
} from "./types";

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
