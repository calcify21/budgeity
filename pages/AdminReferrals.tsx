import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import {
  Search,
  RefreshCw,
  User,
  Calendar,
  Trash2,
  TrendingUp,
  Mail,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";
import CustomSelect from "../components/CustomSelect";
import { ONBOARDING_REFERRAL_OPTIONS } from "../constants";
import { ICON_MAP } from "../utils";
import { useToast } from "../context/ToastContext";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

interface ReferralItem {
  id: string;
  name: string;
  email: string;
  uid: string;
  source: string;
  createdAt: FirestoreTimestamp | null;
}


const AdminReferrals: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useData();
  const { error: toastError } = useToast();
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "referrals"),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ReferralItem[];
      setReferrals(data);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "referrals", deleteId));
      setReferrals((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting referral record:", err);
      toastError("Failed to delete record. Check permissions.");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchReferrals();
    }
  }, [user, isAdmin]);

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Derive channel display data directly from ONBOARDING_REFERRAL_OPTIONS so
  // any new channel added there automatically appears here too.
  type ChannelStyle = { label: string; icon: React.ElementType; color: string; bg: string; text: string };
  const CHANNELS: Record<string, ChannelStyle> = Object.fromEntries(
    ONBOARDING_REFERRAL_OPTIONS.map((opt) => [
      opt.id,
      {
        label: opt.text,
        icon: ICON_MAP[opt.iconName] as React.ElementType,
        color: opt.chartColor,
        bg: opt.chartBg,
        text: opt.chartText,
      },
    ]),
  );

  const getChannelStyle = (source: string) => {
    const key = Object.keys(CHANNELS).find(
      (k) => source === k || source.startsWith(`${k}:`)
    ) || "other";
    return CHANNELS[key];
  };

  const getDisplayLabel = (source: string) => {
    if (source.startsWith("other:")) {
      const detail = source.substring("other:".length).trim();
      return detail ? `Other (${detail})` : "Other";
    }
    const channel = CHANNELS[source];
    return channel ? channel.label : source;
  };

  // Calculate metrics
  const totalCount = referrals.length;
  const sourceCounts: Record<string, number> = {};
  
  referrals.forEach((item) => {
    const styleKey = Object.keys(CHANNELS).find(
      (k) => item.source === k || item.source.startsWith(`${k}:`)
    ) || "other";
    sourceCounts[styleKey] = (sourceCounts[styleKey] || 0) + 1;
  });

  const topChannel = Object.entries(sourceCounts).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["none", 0]
  );
  const topChannelLabel = CHANNELS[topChannel[0]]?.label || "None";

  // Select options for CustomSelect channel filter
  const selectOptions = [
    { value: "all", label: "All Channels" },
    ...Object.entries(CHANNELS).map(([key, style]) => ({
      value: key,
      label: style.label,
      icon: style.icon,
    })),
  ];

  // Filtered list
  const filteredReferrals = referrals.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterSource === "all") return matchesSearch;
    
    const styleKey = Object.keys(CHANNELS).find(
      (k) => item.source === k || item.source.startsWith(`${k}:`)
    ) || "other";
    
    return matchesSearch && styleKey === filterSource;
  });

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            User Referrals & Acquisition
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Analyze user growth channels and details collected during onboarding
          </p>
        </div>
        <button
          onClick={fetchReferrals}
          className="p-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-all shadow-sm focus:outline-none flex items-center gap-2 font-bold text-sm text-slate-700 dark:text-zinc-300"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Signups */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
              Total Recorded Signups
            </span>
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
              {totalCount}
            </span>
          </div>
          <div className="p-4 bg-brand-500/10 rounded-2xl text-brand-500 shrink-0">
            <User size={32} />
          </div>
        </div>

        {/* Top Channel */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
              Top Acquisition Channel
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block truncate max-w-[200px]">
              {topChannelLabel}
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 block mt-1">
              {topChannel[1]} response{topChannel[1] !== 1 && "s"} ({totalCount > 0 ? Math.round((topChannel[1] / totalCount) * 100) : 0}%)
            </span>
          </div>
          <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-500 shrink-0">
            <TrendingUp size={32} />
          </div>
        </div>

        {/* Dynamic Channel Breakdown Card */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/80 p-6 rounded-3xl shadow-sm md:col-span-1">
          <h4 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
            Quick Shares
          </h4>
          <div className="flex gap-1.5 h-6 rounded-full overflow-hidden w-full bg-slate-100 dark:bg-zinc-800">
            {Object.keys(CHANNELS).map((key) => {
              const count = sourceCounts[key] || 0;
              const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
              if (percentage === 0) return null;
              const style = CHANNELS[key];
              return (
                <div
                  key={key}
                  style={{ width: `${percentage}%` }}
                  className={`${style.color} h-full`}
                  title={`${style.label}: ${count} (${Math.round(percentage)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-start text-[10px] font-bold text-slate-500 dark:text-zinc-400">
            {Object.keys(CHANNELS).map((key) => {
              const count = sourceCounts[key] || 0;
              if (count === 0) return null;
              const style = CHANNELS[key];
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${style.color}`} />
                  <span>{style.label} ({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Acquisition Share Breakdown */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/80 p-6 rounded-[2.5rem] shadow-sm max-w-5xl mx-auto">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
          Detailed Channel Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(CHANNELS).map(([key, style]) => {
            const count = sourceCounts[key] || 0;
            const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const Icon = style.icon;
            return (
              <div key={key} className="space-y-2 p-4 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800/40">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${style.bg} ${style.text}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {style.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-950 dark:text-white text-base">
                      {count}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-bold ml-1.5">
                      ({percentage}%)
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="h-2.5 w-full bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${style.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Table / List Card */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-800/80 p-6 rounded-[2.5rem] shadow-sm max-w-5xl mx-auto space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white shrink-0 self-start md:self-center">
            Signups List
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search user or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 dark:text-white transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="w-full sm:w-52">
              <CustomSelect
                value={filterSource}
                onChange={setFilterSource}
                options={selectOptions}
                placeholder="Filter Channels"
              />
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-hidden">
          {filteredReferrals.length === 0 && !loading ? (
            <div className="text-center py-20 text-slate-400 dark:text-zinc-500 font-bold">
              No matching signup records found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReferrals.map((item) => {
                const style = getChannelStyle(item.source);
                const Icon = style.icon;
                const initials = item.name
                  ? item.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                  : "?";

                return (
                  <div
                    key={item.id}
                    className="p-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow group/item"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
                        {initials}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>{item.name || "Anonymous User"}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5 ${style.bg} ${style.text}`}>
                            <Icon size={10} />
                            {getDisplayLabel(item.source)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400 dark:text-zinc-500 font-medium truncate">
                          <Mail size={12} />
                          <span>{item.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-zinc-800/50">
                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 font-bold">
                        <Calendar size={12} />
                        <span>
                          {item.createdAt?.seconds
                            ? new Date(item.createdAt.seconds * 1000).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Just now"}
                        </span>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all focus:outline-none shrink-0"
                        title="Delete Record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Signup Record?"
        message="Are you sure you want to delete this record? This action cannot be undone."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};

export default AdminReferrals;
