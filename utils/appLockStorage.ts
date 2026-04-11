// ── App Lock Storage Manager ─────────────────────────────────────────
// Hybrid storage: localStorage (fast, offline) + Firestore (persistent, cross-device)
// All keys are scoped per user UID.

import {
  AppLockPreferences,
  AppLockStoredData,
  DEFAULT_APP_LOCK_PREFERENCES,
} from "../types/appLockTypes";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_PREFIX = "budgeity_applock_";

// ── LocalStorage Helpers ──────────────────────────────────────────────

function getLocalKey(uid: string): string {
  return `${STORAGE_PREFIX}${uid}`;
}

function getLocalData(uid: string): AppLockStoredData | null {
  try {
    const raw = localStorage.getItem(getLocalKey(uid));
    if (!raw) return null;
    return JSON.parse(raw) as AppLockStoredData;
  } catch {
    return null;
  }
}

function setLocalData(uid: string, data: AppLockStoredData): void {
  try {
    localStorage.setItem(getLocalKey(uid), JSON.stringify(data));
  } catch (e) {
    console.error("[AppLock] Failed to write localStorage:", e);
  }
}

function clearLocalData(uid: string): void {
  try {
    localStorage.removeItem(getLocalKey(uid));
  } catch {
    // Silently ignore
  }
}

// ── Firestore Helpers ─────────────────────────────────────────────────

function getFirestoreRef(uid: string) {
  return doc(db, "users", uid, "settings", "appLock");
}

async function getFirestoreData(
  uid: string,
): Promise<AppLockStoredData | null> {
  try {
    const snap = await getDoc(getFirestoreRef(uid));
    if (snap.exists()) {
      return snap.data() as AppLockStoredData;
    }
    return null;
  } catch (e) {
    console.warn("[AppLock] Firestore read failed (offline?):", e);
    return null;
  }
}

async function setFirestoreData(
  uid: string,
  data: AppLockStoredData,
): Promise<void> {
  try {
    await setDoc(getFirestoreRef(uid), data, { merge: true });
  } catch (e) {
    console.warn("[AppLock] Firestore write failed (offline?):", e);
  }
}

async function clearFirestoreData(uid: string): Promise<void> {
  try {
    await deleteDoc(getFirestoreRef(uid));
  } catch (e) {
    console.warn("[AppLock] Firestore delete failed:", e);
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Load app lock data: try localStorage first (fast), then Firestore (authoritative).
 * If Firestore has data but localStorage doesn't, cache it locally.
 */
export async function loadAppLockData(
  uid: string,
): Promise<AppLockStoredData> {
  const defaultData: AppLockStoredData = {
    preferences: { ...DEFAULT_APP_LOCK_PREFERENCES },
    hashedPin: null,
    hashedPattern: null,
    webauthnCredentialId: null,
  };

  // 1. Try localStorage first (instant, works offline)
  const localData = getLocalData(uid);

  // 2. Try Firestore (authoritative)
  const firestoreData = await getFirestoreData(uid);

  if (firestoreData) {
    // Firestore is authoritative — cache locally and return
    setLocalData(uid, firestoreData);
    return firestoreData;
  }

  if (localData) {
    // Only local data exists (offline or first time before sync)
    return localData;
  }

  // No data anywhere — return defaults
  return defaultData;
}

/**
 * Load app lock data synchronously from localStorage only.
 * Used for immediate lock-check on app open (before async Firestore).
 */
export function loadAppLockDataSync(uid: string): AppLockStoredData {
  const localData = getLocalData(uid);
  if (localData) return localData;
  return {
    preferences: { ...DEFAULT_APP_LOCK_PREFERENCES },
    hashedPin: null,
    hashedPattern: null,
    webauthnCredentialId: null,
  };
}

/**
 * Save app lock data to both localStorage and Firestore.
 */
export async function saveAppLockData(
  uid: string,
  data: AppLockStoredData,
): Promise<void> {
  // Write localStorage immediately (fast)
  setLocalData(uid, data);
  // Write Firestore in background (persistent)
  await setFirestoreData(uid, data);
}

/**
 * Clear all app lock data from both localStorage and Firestore.
 * Used for "Forgot Lock" flow.
 */
export async function clearAllAppLockData(uid: string): Promise<void> {
  clearLocalData(uid);
  await clearFirestoreData(uid);
}

/**
 * Get just the preferences (quick read from localStorage).
 */
export function getPreferencesSync(uid: string): AppLockPreferences {
  const data = getLocalData(uid);
  return data?.preferences ?? { ...DEFAULT_APP_LOCK_PREFERENCES };
}

/**
 * Get the hashed PIN from localStorage.
 */
export function getHashedPinSync(uid: string): string | null {
  const data = getLocalData(uid);
  return data?.hashedPin ?? null;
}

/**
 * Get the hashed pattern from localStorage.
 */
export function getHashedPatternSync(uid: string): string | null {
  const data = getLocalData(uid);
  return data?.hashedPattern ?? null;
}
