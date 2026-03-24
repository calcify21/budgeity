import React from "react";
import {
  CheckCircle2,
  Star,
  Zap,
  LayoutDashboard,
  Wallet,
  Repeat,
  Filter,
  Calendar,
  Plus,
  Sparkles,
  BarChart3,
  Shield,
  Globe,
  Compass,
  Smartphone,
  Share2,
  Send,
  ListTodo,
  Columns,
  Coins,
  ShieldCheck,
  PiggyBank,
  MessageSquare,
  Calculator,
  Sun,
  Lock,
  ShoppingCart,
  Undo2,
  ArrowUpDown,
  Target,
  Activity,
  Flame,
  CalendarDays,
  TrendingUp,
  Type,
  Maximize2,
  Users,
  UserPlus,
  Home,
  PieChart,
  Eye,
  History,
  ArrowLeftRight,
  SlidersHorizontal,
  AlertCircle,
  Camera,
  Cloud,
} from "lucide-react";
import { motion } from "framer-motion";

const FacebookIcon = (props: any) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    width="24"
    height="24"
    {...props}
  >
    <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 4.96 3.63 9.08 8.4 9.83v-6.95h-2.53v-2.88h2.53v-2.19c0-2.5 1.53-3.87 3.76-3.87 1.07 0 1.99.08 2.26.11v2.63l-1.55.02c-1.22 0-1.46.58-1.46 1.44v1.86h2.9l-.38 2.88h-2.52v6.95c4.77-.75 8.4-4.87 8.4-9.83 0-5.5-4.46-9.96-9.96-9.96z" />
  </svg>
);

const MotionDiv = motion.div as any;

const ChangeItem = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
    <div className="p-3 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-xl shrink-0">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const WhatsNew: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl">
          <Star size={32} fill="currentColor" className="opacity-80" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">What's New</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Discover the latest updates and improvements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChangeItem
          icon={LayoutDashboard}
          title="Premium Household Banners"
          description="Instant clarity for your shared spaces! A beautiful glassmorphic banner now appears at the top of your dashboard whenever you enter a shared Household workspace."
        />
        <ChangeItem
          icon={Eye}
          title="Full-Screen Profile View"
          description="See yourself in high resolution. Tapping your profile picture now opens a stunning, full-screen preview of your custom avatar or Google profile photo."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Role-Based Invitations"
          description="Granular control from the start. Household invitations now perfectly honor Admin, Member, or Viewer roles upon acceptance — no more manual adjustments needed."
        />
        <ChangeItem
          icon={Lock}
          title="Integrated Privacy Toggles"
          description="Control your privacy with speed. The 'Hide Balances' toggle is now available directly in the main App Settings, persistent across all your sessions."
        />
        <ChangeItem
          icon={Camera}
          title="Refined Avatar Cropping"
          description="Overhauled cropping UI! Enjoy a larger workspace and high-contrast circular guides to ensure your profile photo is always perfectly framed."
        />
        <ChangeItem
          icon={ArrowUpDown}
          title="Intelligent Bulk Editing"
          description="Smarter bulk actions! When editing multiple transactions, Budgeity now intelligently detects mixed income/expense types, locking mismatched category changes to prevent data corruption while streamlining your workflow."
        />
        <ChangeItem
          icon={History}
          title="Smart Data Auditing"
          description="Full transparency for every rupee. Every change to your wallets, budgets, and goals is now captured in a detailed audit log, showing exactly who did what and when, ensuring total accountability in shared spaces."
        />
        <ChangeItem
          icon={Zap}
          title="Instant PWA App Shortcuts"
          description="Efficiency at your fingertips! Long-press the app icon on your home screen or right-click the taskbar on desktop to instantly Add Expense, Add Income, or jump to your Shopping List without even opening the main menu."
        />
        <ChangeItem
          icon={UserPlus}
          title="Member Self-Management"
          description="Take control of your household membership! You can now leave a shared household or update your profile data (name and avatar) within a shared space independently."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Real-Time Household Activity"
          description="We've re-engineered our database security protocols to allow high-speed, real-time activity logging within shared households. Your family's spending history now syncs instantly across all devices."
        />
        <ChangeItem
          icon={Sparkles}
          title="Brand New Visual Identity"
          description="Budgeity has a fresh new look! Experience our stunning new high-resolution logo, refined brand colors, and a completely overhauled visual system designed for a premium fintech feel."
        />
        <ChangeItem
          icon={Smartphone}
          title="Advanced PWA Integration"
          description="Take Budgeity anywhere. Our new Progressive Web App (PWA) engine features high-definition icons and full support for Android 'Maskable' icons, ensuring we look native on every home screen."
        />
        <ChangeItem
          icon={Globe}
          title="Cross-Device Branding"
          description="Consistency matters. From your browser tab's favicon to your mobile splash screen, our identity is now perfectly standardized across all platforms and devices."
        />

        <ChangeItem
          icon={BarChart3}
          title="Analytics V2 Engine"
          description="A completely redesigned analytics system! Deep dive into your finances with 5 specialized sections: Financial Health, Spending Behavior, Budget Control, Financial Growth, and Smart Insights."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="Modular Bento Analytics"
          description="Your data, your way. Reorder, hide, or enable analytics widgets across sections with a custom bento-grid layout that perfectly adapts to your screen."
        />
        <ChangeItem
          icon={Type}
          title="Custom Section Renaming"
          description="Personalize your insights! You can now rename any analytics section directly in edit mode to match your own financial philosophy and goals."
        />
        <ChangeItem
          icon={Filter}
          title="Precision Time Controls"
          description="Go deeper with our expanded time filters. Toggle between 1W, 1M, 3M, 6M, 1Y, and 'All Time' to see your financial trends with surgical precision."
        />
        <ChangeItem
          icon={Maximize2}
          title="Symmetrical Core Design"
          description="We've re-engineered the inner layout of every card. Charts and metrics now vertically center themselves automatically, ensuring a balanced and premium look regardless of card size."
        />
        <ChangeItem
          icon={Sparkles}
          title="Advanced Smart Insights"
          description="Our insights engine just got a major UI upgrade! Actionable financial observations are now presented in a beautiful, glass-card grid for maximum readability."
        />
        <ChangeItem
          icon={Users}
          title="Household Profile Sync"
          description="Your display name, photo, and custom avatar now automatically sync to every household you belong to. Change your profile once, and it updates everywhere instantly — no manual refresh needed."
        />
        <ChangeItem
          icon={Camera}
          title="Custom Avatars in Households"
          description="Household member bubbles across Wallets, Dashboard, Transactions, and Settings now show your custom avatar instead of just the Google photo. Custom avatars always take priority."
        />
        <ChangeItem
          icon={Home}
          title="Editable Household Icons"
          description="Household icons are no longer locked after creation! Admins and owners can now click the icon in Household Settings to change it anytime using the full icon picker."
        />
        <ChangeItem
          icon={Shield}
          title="Enhanced Firestore Security"
          description="We've hardened our database security rules with strict role-based access, prevented personal metadata leaks into shared household documents, and moved avatar storage into secure user metadata."
        />
        <ChangeItem
          icon={BarChart3}
          title="Navigation Active State Fix"
          description="Fixed a visual bug where both Analytics and Analytics V2 would highlight simultaneously in the sidebar. Each nav item now correctly tracks its own active state."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="Fully Customizable Dashboard"
          description="Your financial command center is now yours to build! Drag, drop, and re-order modular widgets like Net Worth, Spending, and Trends to create the perfect layout for your needs."
        />
        <ChangeItem
          icon={SlidersHorizontal}
          title="Adaptive Widget Library"
          description="Choose exactly what matters. Our new library allows you to toggle specialized widgets—like Income vs Expense, Savings Rate, and Planned Spending—on or off with a single click."
        />
        <ChangeItem
          icon={Cloud}
          title="Cloud-Synced Layouts"
          description="Never lose your perfect setup. Your custom dashboard configuration is now securely saved to your Google Cloud account and syncs instantly across all your devices."
        />
        <ChangeItem
          icon={Type}
          title="Professional Design Polish"
          description="We've refined the typography and layout across the Goals and Dashboard pages, fixing casing issues and spacing for a cleaner, high-end professional fintech aesthetic."
        />
        <ChangeItem
          icon={Camera}
          title="Professional Profile Photos"
          description="Make Budgeity truly yours! You can now upload, crop, and set a custom profile photo. We've added a smooth, mobile-friendly cropping interface with zoom and rotation to ensure you look your best."
        />
        <ChangeItem
          icon={Zap}
          title="Zero-Storage Image Engine"
          description="Speed matters. We've engineered a custom image engine that compresses your avatars into tiny < 10KB strings. This means instant loading and perfectly sharp photos without any extra storage bloat."
        />
        <ChangeItem
          icon={Activity}
          title="Real-Time System Status"
          description="Never guess if your data is saved again. The new System Status Indicator in the header shows if you're Online (Green), Syncing (Amber), or Offline (Gray) in real-time."
        />
        <ChangeItem
          icon={Zap}
          title="Optimistic UI & Instant Saves"
          description="Transactions now appear on your screen instantly while saving to the cloud perfectly in the background. Enjoy zero lag and a completely frictionless financial logging experience."
        />
        <ChangeItem
          icon={Compass}
          title="Premium Floating Navigation"
          description="Experience our beautiful new floating bottom navigation bar on mobile and tablet! It features a sleek glassmorphic design, immersive animations, and a centralized Quick Add button."
        />
        <ChangeItem
          icon={SlidersHorizontal}
          title="Customizable Menus"
          description="Your app, your rules. You can now drag, drop, and reorder your favorite navigation tabs in the 'More' menu to pin exactly what you need to your bottom bar."
        />
        <ChangeItem
          icon={Sparkles}
          title="Global Aesthetic Polish"
          description="We've elevated the entire Budgeity experience with tighter layouts, perfectly rounded modal corners, solid premium buttons, and refined micro-interactions across every screen."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Rock-Solid Stability"
          description="We've exterminated several elusive bugs, including an infinite update loop during navigation drag-and-drop and a complex 'Toast Provider' crash, ensuring a flawlessly smooth experience."
        />
        <ChangeItem
          icon={Globe}
          title="Global Hindi Translation"
          description="Budgeity is now fully accessible in Hindi! Instantly toggle your language preference in Settings and enjoy a completely localized, premium financial experience across every single page."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="2050-Style Dashboard UI"
          description="Experience our next-generation interface featuring stunning frosted glassmorphism cards and a fluid staggered bento-grid layout."
        />
        <ChangeItem
          icon={Compass}
          title="Premium Empty States"
          description="Starting fresh? We've completely redesigned all empty screens across Budgets, Goals, Recurring, and Categories with high-end, illustrative guides to perfectly onboard you to new features."
        />

        <ChangeItem
          icon={Share2}
          title="Branded PDF Exports with Logo"
          description="Your exported PDF reports now feature the Budgeity logo prominently in the header alongside the brand name, giving your financial documents a polished, professional look."
        />
        <ChangeItem
          icon={Columns}
          title="Cleaner Excel & CSV Exports"
          description="Excel and CSV files now open with a 'Budgeity – Transaction Report' title row for easy identification. Empty subcategories no longer show an ugly hyphen — they're simply left blank."
        />
        <ChangeItem
          icon={AlertCircle}
          title="Scroll to Error on Save"
          description="Forms in all modals now automatically scroll to the top to reveal the error message when you click Save or Submit with invalid data — no more hunting for what went wrong."
        />
        <ChangeItem
          icon={PieChart}
          title="Premium Dashboard Analytics"
          description="The Dashboard spending breakdown has been completely redesigned! Enjoy a stunning new donut chart with interactive segment highlighting and an enhanced, detailed legend grid."
        />
        <ChangeItem
          icon={CalendarDays}
          title="High-Speed Date Selection"
          description="Navigate across months and years in a single click! Our new custom date picker now features a high-speed jumping interface for faster financial logging."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Future-Proof Validation"
          description="Never accidentally log a transaction in the future again. We've added strict date validation and picker restrictions to keep your financial records accurate."
        />
        <ChangeItem
          icon={Sparkles}
          title="Full UI Standardization"
          description="We've completed a full audit of the application. Every native select and date input has been replaced with our premium custom components for a 100% cohesive look and feel."
        />
        <ChangeItem
          icon={Zap}
          title="Recurring Engine Performance"
          description="Historical catch-up for recurring transactions is now significantly faster and more robust, with added safety warnings for large data generations."
        />
        <ChangeItem
          icon={FacebookIcon}
          title="Sign in with Facebook"
          description="You can now securely log in to Budgeity using your Facebook account! It's fast, password-free, and automatically syncs your profile picture."
        />
        <ChangeItem
          icon={Send}
          title="Passwordless Magic Links"
          description="Forgot your password? No problem. Use our new 'Magic Link' feature to receive a secure, one-time login link directly to your inbox."
        />
        <ChangeItem
          icon={BarChart3}
          title="Smarter Top Category"
          description="The 'Top Category' shown on your Transactions page now calculates based on your total spending amount rather than just the number of transactions, perfectly aligning with your Analytics."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="UI & Tour Polish"
          description="We've fixed text clipping issues on long transaction notes and smoothed out wrinkles in the guided tour, particularly around the Recurring Rules section."
        />
        <ChangeItem
          icon={Compass}
          title="Expanded Interactive Tour"
          description="Our onboarding tour has been completely expanded! It seamlessly guides you through our newest features, including Household Workspaces, Budget vs Actual analytics, Dashboard widgets, and Detailed Audit Trails."
        />
        <ChangeItem
          icon={CheckCircle2}
          title="Flawless Onboarding Flow"
          description="We've dramatically improved the reliability of our guided tour, resolving tricky edge cases on complex pages like Recurring Rules and Shopping Lists to ensure a 100% smooth introduction."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Global Compliance Update"
          description="We've completely rewritten our Privacy Policy and Terms of Service. They are now fully globally compliant, featuring GDPR-style data rights and critical financial disclaimers."
        />
        <ChangeItem
          icon={Lock}
          title="Infrastructure Security"
          description="We've hardened our Firestore security rules with fine-grained access control for household invites and fixed critical race conditions during authentication for a rock-solid experience."
        />
        <ChangeItem
          icon={Globe}
          title="Universal Currency Support"
          description="Global currencies are now production-ready! All financial calculations and labels across Personal and Household workspaces seamlessly respect your custom currency setting."
        />
        <ChangeItem
          icon={Sparkles}
          title="Robust User Avatars"
          description="Avatars now feature bulletproof fallback logic. If a profile picture is missing or fails to load, beautifully rendered initials appear instantly, ensuring a professional look at all times."
        />
        <ChangeItem
          icon={MessageSquare}
          title="Modern Toast Notifications"
          description="Goodbye, clunky browser alerts! We've integrated sleek, non-intrusive toast notifications for household management, making errors and successes feel part of the app experience."
        />
        <ChangeItem
          icon={Send}
          title="Advanced Invite Tracking"
          description="Owners and Admins can now track all outgoing pending invites directly from the Member Management Panel, with real-time visibility into recipient status and expiration dates."
        />
        <ChangeItem
          icon={Sun}
          title="High-Contrast Initials"
          description="Improved visibility for everyone! Avatar fallbacks now use high-contrast brand colors optimized specifically for light mode, ensuring initials are always crisp and readable."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Critical Stability Fixes"
          description="We've crushed several 'undefined field' crashes in our household engine, ensuring a stable experience when creating households, joining shared spaces, and updating members."
        />
        <ChangeItem
          icon={Zap}
          title="Zero-Lag Virtualized UI"
          description="We've implemented a state-of-the-art virtualized rendering engine for our new Icon Picker. Scroll through 1,450+ icons with absolute zero lag or locking!"
        />
        <ChangeItem
          icon={Sparkles}
          title="Complete Lucide Icon Library"
          description="Our icon pickers just got a massive upgrade! You now have access to the entire 1,450+ library of beautiful icons across Categories, Wallets, Households, and Goals."
        />
        <ChangeItem
          icon={Filter}
          title="Smart Icon Categories"
          description="To keep the massive icon library organized, icons are now intelligently grouped into categories like Finance, Food, Transport, and UI. Search instantly filters as you type."
        />
        <ChangeItem
          icon={SlidersHorizontal}
          title="Cleaner Number Inputs"
          description="We've removed those clunky up/down stepper arrows from all number inputs across the app, ensuring a much cleaner, standardized look when entering amounts."
        />
        <ChangeItem
          icon={Target}
          title="Redesigned Goals System"
          description="A completely revamped Goals system featuring an advanced prediction engine that calculates your exact 'Savings Velocity' and gives actionable projection insights on when you'll reach your targets."
        />
        <ChangeItem
          icon={Shield}
          title="Hidden Goal Wallets"
          description="Goals are now backed by isolated, hidden wallets. Your goal savings are securely tracked and separated from your general spending without cluttering up your dashboard and analytics."
        />

        <ChangeItem
          icon={Maximize2}
          title="Smart Modal Scrolling"
          description="We've optimized all our forms and modals (like Add Wallet, Add Category, and Goal details) to gracefully adapt to smaller screens with smooth internal scrolling."
        />
        <ChangeItem
          icon={UserPlus}
          title="Google-Style Profile Dropdown"
          description="We've completely redesigned the account menu! Enjoy a more spacious, centralized layout featuring your avatar and a new streamlined 'Sign out' button."
        />

        <ChangeItem
          icon={Zap}
          title="Fully Automated Recurring Engine"
          description="Never miss a payment! Background automation now generates recurring transactions exactly when they are due, even catching up on missed cycles if you've been offline."
        />
        <ChangeItem
          icon={Repeat}
          title="Dedicated Recurring Management"
          description="A brand new dedicated page to view, pause, edit, and create advanced recurring templates with yearly cost estimations built right in."
        />
        <ChangeItem
          icon={CalendarDays}
          title="Upcoming Dashboard Reminders"
          description="Prefer to pay manually? Recurring items set to 'Reminder Only' now aggregate onto your dashboard so you never miss a pending bill."
        />
        <ChangeItem
          icon={CheckCircle2}
          title="Mark Bills as Paid Instantly"
          description="Click 'Mark Paid' directly on your Dashboard Reminders widget. The transaction is instantly logged on the exact due date, saving you time."
        />
        <ChangeItem
          icon={Repeat}
          title="Custom Recurring Names & Subcategories"
          description="Give your recurring transactions a custom name! The name and specific subcategories now perfectly sync across your Upcoming Reminders and full history log."
        />
        <ChangeItem
          icon={Activity}
          title="Smooth Workspace Loading"
          description="Switching between personal and household workspaces now features a beautiful, personalized loading screen with progress animations instead of a jarring flash."
        />
        <ChangeItem
          icon={Home}
          title="Household Collaboration"
          description="Create shared households and manage finances together with family or roommates. Each household has its own wallets, transactions, budgets, and goals — completely isolated from your personal data."
        />
        <ChangeItem
          icon={ArrowLeftRight}
          title="Workspace Switcher"
          description="Seamlessly toggle between your Personal account and any Household you belong to. A single click in the navbar switches your entire financial view."
        />
        <ChangeItem
          icon={UserPlus}
          title="Invite System"
          description="Invite people by email to join your household. They'll see a notification badge on their workspace switcher and can accept or decline inline — no separate page needed."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Role-Based Access Control"
          description="Assign roles to household members: Owner, Admin, Member, or Viewer. Each role has specific permissions — viewers can only see data, members can add, admins can manage."
        />
        <ChangeItem
          icon={Users}
          title="Member Avatar Stacks"
          description="See who's in your household at a glance. Member avatars appear on wallet cards and the dashboard net worth card when in household mode."
        />
        <ChangeItem
          icon={PieChart}
          title="Member Spending Breakdown"
          description="A new pie chart on the Dashboard shows exactly who's spending what in the household — with avatars, amounts, and percentages for each member."
        />
        <ChangeItem
          icon={SlidersHorizontal}
          title="Analytics Member Filter"
          description="Filter all Analytics charts by member. See 'All Members', 'My Spending', or drill into a specific household member's transactions."
        />
        <ChangeItem
          icon={Eye}
          title="Transaction Attribution"
          description="Every transaction shows who created it with an avatar badge. Click any transaction to see the full audit trail — who created it and who last edited it."
        />
        <ChangeItem
          icon={History}
          title="Activity Log"
          description="A timestamped timeline in Household Settings showing every action: who added expenses, edited budgets, changed roles, or joined the household."
        />
        <ChangeItem
          icon={Filter}
          title="Subcategory in Transactions"
          description="Transaction items now display the subcategory alongside the wallet and note — so you can see 'Food → Dining Out' at a glance without opening the details."
        />
        <ChangeItem
          icon={Activity}
          title="Analytics Snapshot Card"
          description="The Dashboard now features a powerful Snapshot card with your Savings Rate, Daily Burn Rate, and Projected Spend — complete with a mini sparkline trend and overspend warnings."
        />
        <ChangeItem
          icon={TrendingUp}
          title="Wallet Flow Intelligence"
          description="Every wallet card now shows real-time In/Out/Net Flow stats so you can instantly see how money is moving through each wallet."
        />
        <ChangeItem
          icon={BarChart3}
          title="Budget vs Actual Charts"
          description="The Analytics page now includes Budget vs Actual bar charts, Variance Analysis, Budget Compliance rings, and Spending by Day of Week breakdowns."
        />
        <ChangeItem
          icon={CalendarDays}
          title="Recurring Expense Insights"
          description="See all your active recurring expenses in one place with monthly cost projections and their percentage of income — right inside Analytics."
        />
        <ChangeItem
          icon={Maximize2}
          title="Overflow & Layout Fixes"
          description="Large numbers no longer break out of cards, modals, or PDF exports. All monetary displays now truncate gracefully with hover tooltips for the full value."
        />
        <ChangeItem
          icon={Type}
          title="Improved Number-to-Words"
          description="Massive amounts now convert correctly to words using proper denominations — Arab, Kharab, Neel, Padma, Shankh (Indian) and Trillion, Quadrillion, Quintillion (International)."
        />
        <ChangeItem
          icon={ShoppingCart}
          title="Smart Partial Purchasing"
          description="Need 3 out of 5? The Shopping List now supports partial quantity buying. Purchase what you need now, and the remaining quantity stays on your list automatically."
        />
        <ChangeItem
          icon={Undo2}
          title="Purchase History & Revert"
          description="Made a mistake? The new Purchase History section shows everything you've bought, and you can revert any purchase with a single click — the transaction is deleted and the item returns to your list."
        />
        <ChangeItem
          icon={ArrowUpDown}
          title="Shopping List Priority Sorting"
          description="Stay organized! Items now display priority indicators and are automatically sorted by priority level, so you always know what's most important."
        />
        <ChangeItem
          icon={Target}
          title="Planned Spending Widget"
          description="A brand-new Dashboard widget shows your estimated shopping costs at a glance. Know exactly how much your shopping list will cost before you head out."
        />
        <ChangeItem
          icon={MessageSquare}
          title="In-App Feedback System"
          description="Your voice matters! Send us bugs, feature requests, or general feedback directly from the app. We've also added a 5-star rating system to hear how we're doing."
        />
        <ChangeItem
          icon={Calculator}
          title="Pro Custom Keyboard"
          description="Entering transactions just got smoother. We've built a custom in-app numeric keypad with integrated math support, replacing the jarring system keyboard."
        />
        <ChangeItem
          icon={Sun}
          title="Theme Toggle"
          description="Light or Dark? You decide. Switch themes instantly from the top navigation bar to suit your environment and eye comfort."
        />
        <ChangeItem
          icon={Lock}
          title="Enhanced Security"
          description="We've strengthened account safety. Critical actions like deleting your account now require explicit verification steps to prevent accidents."
        />
        <ChangeItem
          icon={PiggyBank}
          title="Subcategory-Specific Budgets"
          description="Precision budgeting is here! You can now create budgets for specific subcategories (like 'Snacks' or 'Streaming') instead of just the whole main category."
        />
        <ChangeItem
          icon={Share2}
          title="Shopping List Share &amp; Copy"
          description="Taking your list to the store? Share it as a text message or copy it to your clipboard with a single click, perfectly formatted with estimated totals."
        />
        <ChangeItem
          icon={ShieldCheck}
          title="Premium Login Experience"
          description="We've redesigned our authentication screen with a polished 'Keep me signed in' tick and refined transitions for a state-of-the-art first impression."
        />
        <ChangeItem
          icon={Wallet}
          title="Live Wallet Balances"
          description="See exactly how much you have left while you spend. Wallet selection dropdowns now show real-time balances below each name."
        />
        <ChangeItem
          icon={Coins}
          title="Net Worth in Words"
          description="Visualize your total wealth better. The dashboard now shows your Net Worth in words (e.g., '1.5 Lakh') supported by both Indian and International number systems."
        />
        <ChangeItem
          icon={Columns}
          title="Separated Category Exports"
          description="Your exports just got cleaner. Categories and Subcategories are now exported into distinct columns in Excel, CSV, and PDF formats for better organization."
        />
        <ChangeItem
          icon={Shield}
          title="Social Login"
          description="Sign in instantly with your Google or GitHub account. Secure, fast, and password-free."
        />
        <ChangeItem
          icon={Calendar}
          title="Premium Date Picker"
          description="Experience our new, beautiful date picker. Optimized for all devices with a single-click selection workflow."
        />
        <ChangeItem
          icon={Wallet}
          title="Simplified Wallet Management"
          description="Deleting wallets is now faster and easier. We've removed the tedious confirmation steps for a smoother experience."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="Brand New Welcome"
          description="Check out our redesigned Landing Page that showcases the power of Budgeity before you even log in."
        />
        <ChangeItem
          icon={Compass}
          title="Enhanced Tour Experience"
          description="We've refined the onboarding tour with a polished, native feel. Enjoy sharp text, custom icons, and buttons that perfectly match the application's aesthetic."
        />
        <ChangeItem
          icon={Globe}
          title="New Public Landing Page"
          description="A stunning new entry point for Budgeity! Showcasing features, differentiation, and beautiful app previews in 3D phone mockups."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="Smart Application Routing"
          description="We've overhauled navigation. The app now lives at /dashboard for authenticated users, ensuring a clear separation from the public site."
        />
        <ChangeItem
          icon={Smartphone}
          title="Visual Polish"
          description="The new landing page features realistic device frames for screenshots and fluid animations for a premium first impression."
        />
        <ChangeItem
          icon={Sparkles}
          title="Premium Financial Analytics"
          description="Our new over-the-top analytics dashboard features sleek donut charts, smart spending insights, and professional-grade data visualization with an Apple Health aesthetic."
        />
        <ChangeItem
          icon={BarChart3}
          title="Deep Drill-down Navigation"
          description="Contextual insights! Tap on any chart segment, summary card, or legend item to jump directly to the filtered transaction list."
        />
        <ChangeItem
          icon={CheckCircle2}
          title="Professional-Grade Precision"
          description="We've standardized all percentages to two decimal places and added explicit data labels to all charts for maximum accuracy and readability."
        />
        <ChangeItem
          icon={Zap}
          title="Install App (PWA)"
          description="Budgeity is now a Progressive Web App! Install it on your phone or desktop for a faster, native-like experience that works offline."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="Navigation Redesign"
          description="We've revamped the navigation with a unified header and cleaner sidebar, making it easier to access your profile and actions."
        />
        <ChangeItem
          icon={CheckCircle2}
          title="Simplified Wallets"
          description="We've removed complex sharing features to focus on a streamlined, personal wallet management experience."
        />
        <ChangeItem
          icon={Plus}
          title="Quick Add Everywhere"
          description="Create new Wallets and Categories on the fly! The 'Add New' option is now available in Settings, Budgets, Goals, and Recurring Rule dropdowns."
        />
        <ChangeItem
          icon={Repeat}
          title="Smarter Recurring Rules"
          description="Control your cash flow better. You can now specify exactly which Wallet an Income goes to or an Expense comes from in your Recurring Rules."
        />
        <ChangeItem
          icon={Calendar}
          title="Enhanced History"
          description="Transaction groups now show the year for older dates, making it easier to browse history. Plus, we've added checks to prevent accidental future dating."
        />
        <ChangeItem
          icon={CheckCircle2}
          title="Stay Logged In"
          description="Tired of logging in? Use the new 'Keep me logged in' option on the sign-in screen to stay authenticated for longer sessions."
        />
        <ChangeItem
          icon={Wallet}
          title="Streamlined Settings"
          description="Managing your Default Wallet and other preferences is smoother than ever with our standardized selection inputs."
        />
        <ChangeItem
          icon={LayoutDashboard}
          title="Polished UI"
          description="We've crushed bugs in subcategory selection and refined the edit modes across the app for a seamless experience."
        />
      </div>

      <div className="mt-12 p-8 bg-slate-100 dark:bg-white/5 rounded-3xl text-center">
        <h2 className="text-xl font-bold mb-2">Enjoying the updates?</h2>
        <p className="text-slate-500 mb-6 mx-auto max-w-md">
          We're constantly improving Budgeity based on your feedback. Stay tuned
          for more features!
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-black rounded-full text-sm font-medium text-slate-500 shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-500" /> All systems
          operational
        </div>
      </div>
    </div>
  );
};

export default WhatsNew;
