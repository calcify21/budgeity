import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { ActivityActionType } from "../types";

export const logActivity = async (
  householdId: string,
  entry: {
    actorUid: string;
    actorName: string;
    actionType: ActivityActionType;
    metadata?: Record<string, any>;
  },
) => {
  try {
    await addDoc(collection(db, "households", householdId, "activityLogs"), {
      ...entry,
      metadata: entry.metadata || {},
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
    // Non-blocking — don't throw
  }
};
