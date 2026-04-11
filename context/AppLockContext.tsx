import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  AppLockPreferences,
  AppLockStoredData,
  AppLockBroadcastMessage,
  LockMethod,
  AutoLockTiming,
  DEFAULT_APP_LOCK_PREFERENCES,
} from "../types/appLockTypes";
import {
  loadAppLockData,
  loadAppLockDataSync,
  saveAppLockData,
  clearAllAppLockData,
} from "../utils/appLockStorage";
import {
  hashValue,
  verifyHash,
  patternToString,
} from "../utils/appLockCrypto";

// ── Context Type ──────────────────────────────────────────────────────

interface AppLockContextType {
  /** Is the app lock system enabled (master switch)? */
  isLockEnabled: boolean;
  /** Is the app currently unlocked (user can see content)? */
  isUnlocked: boolean;
  /** Lock preferences */
  preferences: AppLockPreferences;
  /** Number of consecutive failed unlock attempts */
  failedAttempts: number;
  /** Cooldown end timestamp (null if no cooldown active) */
  cooldownUntil: number | null;
  /** Is this the first time setup (no lock configured yet)? */
  isFirstTimeSetup: boolean;
  /** Is biometrics available on this device/context? */
  isBiometricsAvailable: boolean;

  // Actions
  lockApp: () => void;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithPattern: (points: number[]) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  setupPattern: (points: number[]) => Promise<void>;
  setupBiometrics: () => Promise<boolean>;
  removeMethod: (method: LockMethod) => Promise<void>;
  updatePreferences: (prefs: Partial<AppLockPreferences>) => Promise<void>;
  setAutoLockTiming: (timing: AutoLockTiming) => Promise<void>;
  toggleAutoLockOnOpen: () => Promise<void>;
  toggleAutoLockOnBackground: () => Promise<void>;
  resetLockData: () => Promise<void>;
  /** Re-load data from Firestore (e.g. after login) */
  refreshData: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

// ── Constants ─────────────────────────────────────────────────────────

const BROADCAST_CHANNEL_NAME = "budgeity_applock";
const GRACE_PERIOD_MS = 3000; // Don't re-lock within 3 seconds of unlock
const COOLDOWN_ATTEMPTS_LEVEL1 = 3; // 10s cooldown after 3 failures
const COOLDOWN_ATTEMPTS_LEVEL2 = 5; // 30s cooldown after 5 failures
const COOLDOWN_DURATION_LEVEL1 = 10_000;
const COOLDOWN_DURATION_LEVEL2 = 30_000;

const INACTIVITY_MS: Record<AutoLockTiming, number> = {
  "30s": 30_000,
  "1min": 60_000,
  "5min": 300_000,
};

// ── Provider ──────────────────────────────────────────────────────────

export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout, sendPasswordlessLink } = useAuth();
  const { info: toastInfo } = useToast();

  // Core state
  const [storedData, setStoredData] = useState<AppLockStoredData>(() => {
    if (user?.uid) return loadAppLockDataSync(user.uid);
    return {
      preferences: { ...DEFAULT_APP_LOCK_PREFERENCES },
      hashedPin: null,
      hashedPattern: null,
      webauthnCredentialId: null,
    };
  });
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const lastUnlockedAtRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const preferences = storedData.preferences;
  const isLockEnabled = preferences.enabled;

  // Derived: is first time (lock enabled but nothing configured)
  const isFirstTimeSetup =
    isLockEnabled &&
    !preferences.configured.pin &&
    !preferences.configured.pattern &&
    !preferences.configured.biometrics;

  // ── Check Biometrics Availability ─────────────────────────────────

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        if (
          window.isSecureContext &&
          window.PublicKeyCredential &&
          typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
            "function"
        ) {
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBiometricsAvailable(available);
        } else {
          setIsBiometricsAvailable(false);
        }
      } catch {
        setIsBiometricsAvailable(false);
      }
    };
    checkBiometrics();
  }, []);

  // ── Load Data on Mount / User Change ──────────────────────────────

  useEffect(() => {
    if (!user?.uid) {
      setDataLoaded(false);
      return;
    }

    const load = async () => {
      const data = await loadAppLockData(user.uid);
      setStoredData(data);
      setDataLoaded(true);

      // If lock is enabled and autoLock.onAppOpen, lock the app immediately
      if (data.preferences.enabled && data.preferences.autoLock.onAppOpen) {
        // Check if at least one method is configured
        const hasConfigured =
          data.preferences.configured.pin ||
          data.preferences.configured.pattern ||
          data.preferences.configured.biometrics;
        if (hasConfigured) {
          setIsUnlocked(false);
        }
      }
    };

    load();
  }, [user?.uid]);

  // ── Persist Helper ────────────────────────────────────────────────

  const persistData = useCallback(
    async (newData: AppLockStoredData) => {
      setStoredData(newData);
      if (user?.uid) {
        await saveAppLockData(user.uid, newData);
      }
    },
    [user?.uid],
  );

  // ── BroadcastChannel Setup ────────────────────────────────────────

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<AppLockBroadcastMessage>) => {
      const msg = event.data;
      if (msg.type === "LOCK") {
        setIsUnlocked(false);
      } else if (msg.type === "UNLOCK") {
        setIsUnlocked(true);
        lastUnlockedAtRef.current = msg.timestamp;
        setFailedAttempts(0);
        setCooldownUntil(null);
      } else if (msg.type === "PREFERENCES_CHANGED" && user?.uid) {
        // Re-read data from localStorage (it was just updated by another tab)
        const data = loadAppLockDataSync(user.uid);
        setStoredData(data);
      }
    };

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [user?.uid]);

  const broadcast = useCallback((msg: AppLockBroadcastMessage) => {
    try {
      broadcastChannelRef.current?.postMessage(msg);
    } catch {
      // Silently ignore if channel is closed
    }
  }, []);

  // ── Auto-Lock: Visibility Change (Background) ────────────────────

  useEffect(() => {
    if (!isLockEnabled || !preferences.autoLock.onBackground || !dataLoaded)
      return;

    const handleVisibilityChange = () => {
      if (document.hidden && isUnlocked) {
        // Check grace period
        const now = Date.now();
        if (
          lastUnlockedAtRef.current &&
          now - lastUnlockedAtRef.current < GRACE_PERIOD_MS
        ) {
          return; // Don't re-lock during grace period
        }

        // Check if at least one method is configured
        const hasConfigured =
          preferences.configured.pin ||
          preferences.configured.pattern ||
          preferences.configured.biometrics;
        if (!hasConfigured) return;

        setIsUnlocked(false);
        broadcast({ type: "LOCK", timestamp: now });
        toastInfo("App locked");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    isLockEnabled,
    preferences.autoLock.onBackground,
    preferences.configured,
    isUnlocked,
    dataLoaded,
    broadcast,
    toastInfo,
  ]);

  // ── Auto-Lock: Inactivity Timer ───────────────────────────────────

  useEffect(() => {
    if (!isLockEnabled || !isUnlocked || !dataLoaded) return;

    const timeoutMs = INACTIVITY_MS[preferences.autoLock.inactivityTimeout];

    const hasConfigured =
      preferences.configured.pin ||
      preferences.configured.pattern ||
      preferences.configured.biometrics;
    if (!hasConfigured) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        // Check grace period before locking
        const now = Date.now();
        if (
          lastUnlockedAtRef.current &&
          now - lastUnlockedAtRef.current < GRACE_PERIOD_MS
        ) {
          return;
        }
        setIsUnlocked(false);
        broadcast({ type: "LOCK", timestamp: now });
        toastInfo("App locked due to inactivity");
      }, timeoutMs);
    };

    // Initial timer
    resetTimer();

    // Reset on user activity
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [
    isLockEnabled,
    isUnlocked,
    preferences.autoLock.inactivityTimeout,
    preferences.configured,
    dataLoaded,
    broadcast,
    toastInfo,
  ]);

  // ── Cooldown Timer ────────────────────────────────────────────────

  useEffect(() => {
    if (cooldownUntil === null) return;

    const remaining = cooldownUntil - Date.now();
    if (remaining <= 0) {
      setCooldownUntil(null);
      return;
    }

    const timer = setTimeout(() => {
      setCooldownUntil(null);
    }, remaining);

    return () => clearTimeout(timer);
  }, [cooldownUntil]);

  // ── Failed Attempt Handler ────────────────────────────────────────

  const handleFailedAttempt = useCallback(() => {
    setFailedAttempts((prev) => {
      const next = prev + 1;
      if (next >= COOLDOWN_ATTEMPTS_LEVEL2) {
        setCooldownUntil(Date.now() + COOLDOWN_DURATION_LEVEL2);
      } else if (next >= COOLDOWN_ATTEMPTS_LEVEL1) {
        setCooldownUntil(Date.now() + COOLDOWN_DURATION_LEVEL1);
      }
      return next;
    });
  }, []);

  const handleSuccessfulUnlock = useCallback(() => {
    const now = Date.now();
    setIsUnlocked(true);
    lastUnlockedAtRef.current = now;
    setFailedAttempts(0);
    setCooldownUntil(null);
    broadcast({ type: "UNLOCK", timestamp: now });
  }, [broadcast]);

  // ── Actions ───────────────────────────────────────────────────────

  const lockApp = useCallback(() => {
    if (!isLockEnabled) return;
    const hasConfigured =
      preferences.configured.pin ||
      preferences.configured.pattern ||
      preferences.configured.biometrics;
    if (!hasConfigured) return;

    setIsUnlocked(false);
    broadcast({ type: "LOCK", timestamp: Date.now() });
    toastInfo("App locked");
  }, [isLockEnabled, preferences.configured, broadcast, toastInfo]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!storedData.hashedPin) return false;
      const match = await verifyHash(pin, storedData.hashedPin);
      if (match) {
        handleSuccessfulUnlock();
        return true;
      }
      handleFailedAttempt();
      return false;
    },
    [storedData.hashedPin, handleSuccessfulUnlock, handleFailedAttempt],
  );

  const unlockWithPattern = useCallback(
    async (points: number[]): Promise<boolean> => {
      if (!storedData.hashedPattern) return false;
      const patternStr = patternToString(points);
      const match = await verifyHash(patternStr, storedData.hashedPattern);
      if (match) {
        handleSuccessfulUnlock();
        return true;
      }
      handleFailedAttempt();
      return false;
    },
    [storedData.hashedPattern, handleSuccessfulUnlock, handleFailedAttempt],
  );

  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!isBiometricsAvailable || !storedData.webauthnCredentialId) return false;

    try {
      // Decode the stored credential ID from base64
      const credentialIdBytes = Uint8Array.from(
        atob(storedData.webauthnCredentialId),
        (c) => c.charCodeAt(0),
      );

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [
            {
              id: credentialIdBytes,
              type: "public-key",
              transports: ["internal"],
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        handleSuccessfulUnlock();
        return true;
      }
      return false;
    } catch (e) {
      console.warn("[AppLock] Biometric authentication failed:", e);
      return false;
    }
  }, [
    isBiometricsAvailable,
    storedData.webauthnCredentialId,
    handleSuccessfulUnlock,
  ]);

  const setupPin = useCallback(
    async (pin: string): Promise<void> => {
      const hashed = await hashValue(pin);
      const newData: AppLockStoredData = {
        ...storedData,
        hashedPin: hashed,
        preferences: {
          ...storedData.preferences,
          enabled: true,
          methods: { ...storedData.preferences.methods, pin: true },
          configured: { ...storedData.preferences.configured, pin: true },
          primaryMethod: storedData.preferences.primaryMethod || "pin",
        },
      };
      await persistData(newData);
      broadcast({ type: "PREFERENCES_CHANGED", timestamp: Date.now() });
    },
    [storedData, persistData, broadcast],
  );

  const setupPattern = useCallback(
    async (points: number[]): Promise<void> => {
      const patternStr = patternToString(points);
      const hashed = await hashValue(patternStr);
      const newData: AppLockStoredData = {
        ...storedData,
        hashedPattern: hashed,
        preferences: {
          ...storedData.preferences,
          enabled: true,
          methods: { ...storedData.preferences.methods, pattern: true },
          configured: {
            ...storedData.preferences.configured,
            pattern: true,
          },
          primaryMethod: storedData.preferences.primaryMethod || "pattern",
        },
      };
      await persistData(newData);
      broadcast({ type: "PREFERENCES_CHANGED", timestamp: Date.now() });
    },
    [storedData, persistData, broadcast],
  );

  const setupBiometrics = useCallback(async (): Promise<boolean> => {
    if (!isBiometricsAvailable || !user?.uid) return false;

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(user.uid);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Budgeity",
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: user.email || "user",
            displayName: user.displayName || "User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential && "rawId" in credential) {
        const credentialId = btoa(
          String.fromCharCode(
            ...new Uint8Array((credential as PublicKeyCredential).rawId),
          ),
        );

        const newData: AppLockStoredData = {
          ...storedData,
          webauthnCredentialId: credentialId,
          preferences: {
            ...storedData.preferences,
            enabled: true,
            methods: {
              ...storedData.preferences.methods,
              biometrics: true,
            },
            configured: {
              ...storedData.preferences.configured,
              biometrics: true,
            },
            primaryMethod: "biometrics",
          },
        };
        await persistData(newData);
        broadcast({ type: "PREFERENCES_CHANGED", timestamp: Date.now() });
        return true;
      }
      return false;
    } catch (e) {
      console.warn("[AppLock] Biometric setup failed:", e);
      return false;
    }
  }, [isBiometricsAvailable, user, storedData, persistData, broadcast]);

  const removeMethod = useCallback(
    async (method: LockMethod): Promise<void> => {
      const newData: AppLockStoredData = { ...storedData };
      newData.preferences = {
        ...newData.preferences,
        methods: { ...newData.preferences.methods, [method]: false },
        configured: { ...newData.preferences.configured, [method]: false },
      };

      if (method === "pin") newData.hashedPin = null;
      if (method === "pattern") newData.hashedPattern = null;
      if (method === "biometrics") newData.webauthnCredentialId = null;

      // If primary method was removed, pick another
      if (newData.preferences.primaryMethod === method) {
        if (newData.preferences.configured.biometrics)
          newData.preferences.primaryMethod = "biometrics";
        else if (newData.preferences.configured.pin)
          newData.preferences.primaryMethod = "pin";
        else if (newData.preferences.configured.pattern)
          newData.preferences.primaryMethod = "pattern";
        else newData.preferences.primaryMethod = null;
      }

      // If nothing is configured anymore, disable the lock
      if (
        !newData.preferences.configured.pin &&
        !newData.preferences.configured.pattern &&
        !newData.preferences.configured.biometrics
      ) {
        newData.preferences.enabled = false;
        setIsUnlocked(true);
      }

      await persistData(newData);
      broadcast({ type: "PREFERENCES_CHANGED", timestamp: Date.now() });
    },
    [storedData, persistData, broadcast],
  );

  const updatePreferences = useCallback(
    async (prefs: Partial<AppLockPreferences>): Promise<void> => {
      const newData: AppLockStoredData = {
        ...storedData,
        preferences: { ...storedData.preferences, ...prefs },
      };

      // If disabling lock entirely, unlock
      if (prefs.enabled === false) {
        setIsUnlocked(true);
      }

      await persistData(newData);
      broadcast({ type: "PREFERENCES_CHANGED", timestamp: Date.now() });
    },
    [storedData, persistData, broadcast],
  );

  const setAutoLockTiming = useCallback(
    async (timing: AutoLockTiming): Promise<void> => {
      await updatePreferences({
        autoLock: { ...preferences.autoLock, inactivityTimeout: timing },
      });
    },
    [preferences.autoLock, updatePreferences],
  );

  const toggleAutoLockOnOpen = useCallback(async (): Promise<void> => {
    await updatePreferences({
      autoLock: {
        ...preferences.autoLock,
        onAppOpen: !preferences.autoLock.onAppOpen,
      },
    });
  }, [preferences.autoLock, updatePreferences]);

  const toggleAutoLockOnBackground = useCallback(async (): Promise<void> => {
    await updatePreferences({
      autoLock: {
        ...preferences.autoLock,
        onBackground: !preferences.autoLock.onBackground,
      },
    });
  }, [preferences.autoLock, updatePreferences]);

  const resetLockData = useCallback(async (): Promise<void> => {
    if (!user?.uid || !user.email) return;
    console.log("[AppLock] Initiating Forgot Lock flow for:", user.email);

    // 1. Send sign in link email
    try {
      await sendPasswordlessLink(user.email);
      console.log("[AppLock] sendPasswordlessLink fired.");
    } catch (e) {
      console.error("[AppLock] sendPasswordlessLink error:", e);
    }

    // 2. Set flag to wipe lock ONLY after successful magic-link sign-in
    window.localStorage.setItem("budgeity_lock_reset_pending", "true");
    console.log("[AppLock] Saved pending reset flag.");

    // 3. Force logout
    console.log("[AppLock] Forcing logout now...");
    await logout();
  }, [user?.uid, user?.email, sendPasswordlessLink, logout]);

  const refreshData = useCallback(async (): Promise<void> => {
    if (!user?.uid) return;
    console.log("[AppLock] refreshData called. Fetching fresh data for UI...", user.uid);
    const data = await loadAppLockData(user.uid);
    setStoredData(data);
    console.log("[AppLock] refreshData loaded preferences:", data.preferences);

    // If lock was fully wiped remotely or by magic link, ensure we are unlocked
    if (!data.preferences.enabled) {
      console.log("[AppLock] Lock is disabled/wiped. Forcing explicit unlock.");
      setIsUnlocked(true);
      setFailedAttempts(0);
      setCooldownUntil(null);
    }
  }, [user?.uid]);

  // ── External Event Sync ───────────────────────────────────────────

  useEffect(() => {
    const handleForceRefresh = () => {
      console.log("[AppLock] Received force refresh event!");
      refreshData();
    };
    window.addEventListener("budgeity_applock_force_refresh", handleForceRefresh);
    return () => window.removeEventListener("budgeity_applock_force_refresh", handleForceRefresh);
  }, [refreshData]);

  // ── Context Value ─────────────────────────────────────────────────

  const value: AppLockContextType = {
    isLockEnabled,
    isUnlocked,
    preferences,
    failedAttempts,
    cooldownUntil,
    isFirstTimeSetup,
    isBiometricsAvailable,
    lockApp,
    unlockWithPin,
    unlockWithPattern,
    unlockWithBiometrics,
    setupPin,
    setupPattern,
    setupBiometrics,
    removeMethod,
    updatePreferences,
    setAutoLockTiming,
    toggleAutoLockOnOpen,
    toggleAutoLockOnBackground,
    resetLockData,
    refreshData,
  };

  return (
    <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
  );
};

export const useAppLock = () => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error("useAppLock must be used within an AppLockProvider");
  }
  return context;
};
