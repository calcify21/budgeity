import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import {
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  User,
  Calendar,
  Check,
  Trash2,
  Undo2,
  Star,
} from "lucide-react";
import { ConfirmModal } from "../components/ConfirmModal";

interface FeedbackItem {
  id: string;
  type: "general" | "bug" | "feature";
  message: string;
  rating?: number;
  userEmail: string;
  createdAt: any;
  status: string;
}

const ADMIN_EMAIL = "jainshr21@gmail.com";

const AdminFeedback: React.FC = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "bug" | "feature" | "general">(
    "all",
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "feedback"),
        orderBy("createdAt", "desc"),
        limit(50),
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeedbackItem[];
      setFeedback(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "feedback", id), {
        status: newStatus,
      });
      // Optimistic update
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus } : item,
        ),
      );
    } catch (err) {
      console.error("Error updating feedback status:", err);
      alert("Failed to update status. Check permissions.");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, "feedback", deleteId));
      // Optimistic update
      setFeedback((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting feedback:", err);
      alert("Failed to delete feedback. Check permissions.");
    }
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchFeedback();
    }
  }, [user]);

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <AlertTriangle className="text-rose-500" size={20} />;
      case "feature":
        return <Lightbulb className="text-amber-500" size={20} />;
      default:
        return <MessageSquare className="text-blue-500" size={20} />;
    }
  };

  const filteredFeedback =
    filter === "all"
      ? feedback
      : feedback.filter((item) => item.type === filter);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            User Feedback
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            View what users are saying about the app
          </p>
        </div>
        <button
          onClick={fetchFeedback}
          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {(["all", "bug", "feature", "general"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${
              filter === f
                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredFeedback.length === 0 && !loading ? (
          <div className="text-center py-20 text-slate-400">
            No feedback found.
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-2xl shadow-sm border transition-all ${
                item.status === "resolved"
                  ? "bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 opacity-75"
                  : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`mt-1 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800 shrink-0`}
                  >
                    {item.status === "resolved" ? (
                      <Check className="text-emerald-500" size={20} />
                    ) : (
                      getIcon(item.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize
                        ${
                          item.type === "bug"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : item.type === "feature"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {item.type}
                      </span>
                      {item.status === "resolved" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Resolved
                        </span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                        <Calendar size={12} />
                        {item.createdAt?.seconds
                          ? new Date(
                              item.createdAt.seconds * 1000,
                            ).toLocaleString()
                          : "Just now"}
                      </span>
                    </div>

                    {/* Rating Display */}
                    {item.rating && (
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= item.rating!
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200 dark:text-zinc-700"
                            }
                          />
                        ))}
                      </div>
                    )}

                    <p
                      className={`text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed ${item.status === "resolved" ? "line-through text-slate-500 dark:text-slate-500" : ""}`}
                    >
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs font-medium text-slate-500">
                      <User size={12} />
                      {item.userEmail}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.status === "resolved" ? (
                    <button
                      onClick={() => handleStatusChange(item.id, "new")}
                      className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors"
                      title="Unresolve (Mark as New)"
                    >
                      <Undo2 size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(item.id, "resolved")}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors"
                      title="Mark as Resolved"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors"
                    title="Delete Feedback"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Feedback?"
        message="Are you sure you want to delete this feedback?"
        confirmText="Delete"
        isDestructive
      />
      </div>
    </div>
  );
};

export default AdminFeedback;
