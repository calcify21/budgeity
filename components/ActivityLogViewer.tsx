import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { ActivityLog } from "../types";
import { Clock, ChevronDown } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  transaction_add: "added a transaction",
  transaction_edit: "edited a transaction",
  transaction_delete: "deleted a transaction",
  wallet_create: "created a wallet",
  wallet_edit: "edited a wallet",
  wallet_archive: "archived a wallet",
  wallet_delete: "deleted a wallet",
  budget_create: "created a budget",
  budget_edit: "edited a budget",
  budget_delete: "deleted a budget",
  goal_create: "created a goal",
  goal_edit: "edited a goal",
  goal_delete: "deleted a goal",
  member_join: "joined the household",
  member_leave: "left the household",
  member_remove: "removed a member",
  member_invite: "invited a new member",
  member_invite_decline: "declined an invitation",
  member_invite_cancel: "cancelled an invitation",
  role_change: "changed a member's role",
  household_create: "created the household",
  household_edit: "updated household settings",
  household_delete: "deleted the household",
};

interface ActivityLogViewerProps {
  householdId: string;
}

const PAGE_SIZE = 20;

const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({
  householdId,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (loadMore = false) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "households", householdId, "activityLogs"),
        orderBy("timestamp", "desc"),
        limit(PAGE_SIZE),
      );

      if (loadMore && lastDoc) {
        q = query(
          collection(db, "households", householdId, "activityLogs"),
          orderBy("timestamp", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE),
        );
      }

      const snapshot = await getDocs(q);
      const items: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
      });

      if (loadMore) {
        setLogs((prev) => [...prev, ...items]);
      } else {
        setLogs(items);
      }

      setHasMore(items.length === PAGE_SIZE);
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (e) {
      console.error("Failed to fetch activity logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [householdId]);

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading activity...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock size={40} className="mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/5"
        >
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 text-xs font-bold shrink-0 mt-0.5">
            {(log.actorName || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-bold">{log.actorName}</span>{" "}
              {ACTION_LABELS[log.actionType] || log.actionType}
            </p>
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {Object.entries(log.metadata)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(" • ")
                  .slice(0, 80)}
              </p>
            )}
          </div>
          <span className="text-xs text-slate-400 shrink-0 mt-0.5">
            {formatTime(log.timestamp)}
          </span>
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => fetchLogs(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/5 rounded-2xl transition-colors"
        >
          <ChevronDown size={16} />
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
};

export default ActivityLogViewer;
