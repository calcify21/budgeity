// ── App Lock Type Definitions ────────────────────────────────────────

export type LockMethod = "biometrics" | "pin" | "pattern";

export type AutoLockTiming = "30s" | "1min" | "5min";

export interface AppLockPreferences {
  /** Master switch — is the app lock system enabled? */
  enabled: boolean;

  /** Which methods are enabled */
  methods: {
    biometrics: boolean;
    pin: boolean;
    pattern: boolean;
  };

  /** Which method is the primary unlock method */
  primaryMethod: LockMethod | null;

  /** Auto-lock settings */
  autoLock: {
    onAppOpen: boolean;
    onBackground: boolean;
    inactivityTimeout: AutoLockTiming;
  };

  /** Whether methods have been set up (have stored credentials) */
  configured: {
    biometrics: boolean;
    pin: boolean;
    pattern: boolean;
  };
}

export interface AppLockStoredData {
  preferences: AppLockPreferences;
  hashedPin: string | null;
  hashedPattern: string | null;
  /** WebAuthn credential ID, base64-encoded */
  webauthnCredentialId: string | null;
}

export interface AppLockState {
  /** Is the app currently unlocked? */
  isUnlocked: boolean;
  /** Timestamp of last successful unlock */
  lastUnlockedAt: number | null;
  /** Number of consecutive failed attempts */
  failedAttempts: number;
  /** Timestamp until which the user must wait before trying again */
  cooldownUntil: number | null;
}

/** The broadcast message shape sent between tabs via BroadcastChannel */
export interface AppLockBroadcastMessage {
  type: "LOCK" | "UNLOCK" | "PREFERENCES_CHANGED";
  timestamp: number;
}

export const DEFAULT_APP_LOCK_PREFERENCES: AppLockPreferences = {
  enabled: false,
  methods: {
    biometrics: false,
    pin: false,
    pattern: false,
  },
  primaryMethod: null,
  autoLock: {
    onAppOpen: true,
    onBackground: true,
    inactivityTimeout: "1min",
  },
  configured: {
    biometrics: false,
    pin: false,
    pattern: false,
  },
};
