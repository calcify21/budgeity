import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  updatePassword,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  checkActionCode,
  verifyBeforeUpdateEmail,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
  FacebookAuthProvider,
  browserSessionPersistence,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  githubProvider,
  facebookProvider,
} from "../firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  confirmReset: (oobCode: string, newPassword: string) => Promise<void>;
  verifyResetCode: (oobCode: string) => Promise<string>;
  verifyEmailAddress: (oobCode: string) => Promise<void>;
  recoverEmail: (oobCode: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  sendPasswordlessLink: (email: string) => Promise<void>;
  completePasswordlessSignIn: (email: string, link: string) => Promise<string | undefined>;
  resendVerification: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle redirect result for mobile logins
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // Sync photoURL if missing or invalid but available in providerData
          const currentPhoto = result.user.photoURL;
          const isPhotoInvalid =
            !currentPhoto ||
            currentPhoto === "null" ||
            currentPhoto === "undefined" ||
            (currentPhoto.includes("facebook.com") &&
              !currentPhoto.includes("?"));

          if (isPhotoInvalid && result.user.providerData.length > 0) {
            let photo = result.user.providerData.find(
              (p) =>
                p.photoURL &&
                p.photoURL !== "null" &&
                p.photoURL !== "undefined",
            )?.photoURL;
            if (photo) {
              if (photo.includes("facebook.com") && !photo.includes("?")) {
                photo += "?type=large";
              }
              await updateProfile(result.user, { photoURL: photo });
              await result.user.reload();
            }
          }
          setUser({ ...auth.currentUser! });
        }
      } catch (error: any) {
        console.error("Redirect login failed", error);
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        let msg = "Failed to sign in.";
        if (error.code === "auth/account-exists-with-different-credential") {
          msg =
            "An account already exists with the same email address but different sign-in credentials.";
        } else if (error.message && error.message.includes("not verified")) {
          msg = error.message;
        }
        setError(msg);
      }
    };

    handleRedirectResult();
  }, []);

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  };

  const login = async (
    email: string,
    password: string,
    remember: boolean = false,
  ) => {
    setError(null);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const isSocial = userCredential.user.providerData.some(
        (p) => p.providerId !== "password",
      );
      // Relax requirement: If social provider is linked, treat as verified for now
      if (!userCredential.user.emailVerified && !isSocial) {
        await signOut(auth);
        throw new Error(
          "Please verify your email address before logging in. Check your inbox for the link.",
        );
      }
    } catch (err: any) {
      let msg = "Failed to login. Please check your credentials.";
      // Map Firebase error codes to user-friendly messages
      if (err.code === "auth/user-not-found") {
        msg = "We could not find an account with this email address.";
      } else if (err.code === "auth/wrong-password") {
        msg = "It seems your password is incorrect. Please try again ";
      } else if (err.code === "auth/invalid-credential") {
        msg = "Please check your credentials and try again ";
      } else if (err.code === "auth/too-many-requests") {
        msg =
          "Sorry there have been too many failed attempts. Please try later ";
      } else if (err.code === "auth/invalid-email") {
        msg = "The email address is not valid ";
      } else if (err.message && err.message.includes("verify your email")) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Update the user's profile with their name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      await sendEmailVerification(userCredential.user);
      // Requirement: Do not allow login until verified. Immediately sign out.
      await signOut(auth);
    } catch (err: any) {
      let msg = "Failed to create account.";
      if (err.code === "auth/email-already-in-use") {
        msg = "This email address is already registered.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      // Preserve critical persistent keys from being wiped on logout
      const preserveKeys = [
        "emailForSignIn",
        "budgeity_lock_reset_pending",
        "theme",
        "budgeity_sidebar_collapsed",
        "i18nextLng"
      ];
      const preserved: Record<string, string> = {};
      preserveKeys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val) preserved[k] = val;
      });

      localStorage.clear(); // Clear local state on logout

      // Restore critical settings
      Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));

      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let msg = "Unable to send reset email.";
      if (err.code === "auth/user-not-found") {
        msg = "No account found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
      throw err;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    setError(null);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      } else {
        throw new Error("No user logged in.");
      }
    } catch (err: any) {
      let msg = "Failed to update password.";
      if (err.code === "auth/requires-recent-login") {
        msg =
          "Security Check: Please log out and log back in to change your password.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak.";
      }
      throw new Error(msg);
    }
  };

  const updateName = async (name: string) => {
    setError(null);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        // Force refresh user state to reflect changes immediately
        await auth.currentUser.reload();
        // Creating a new object reference to trigger React updates
        if (auth.currentUser) {
          setUser({ ...auth.currentUser });
        }
      } else {
        throw new Error("No user logged in.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update display name.");
      throw err;
    }
  };

  const confirmReset = async (oobCode: string, newPassword: string) => {
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
    } catch (err: any) {
      let msg = "Failed to reset password.";
      if (err.code === "auth/expired-action-code") {
        msg = "The reset link has expired. Please request a new one.";
      } else if (err.code === "auth/invalid-action-code") {
        msg = "The reset link is invalid. Please request a new one.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password is too weak.";
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyResetCode = async (oobCode: string) => {
    setError(null);
    try {
      return await verifyPasswordResetCode(auth, oobCode);
    } catch (err: any) {
      let msg = "Invalid or expired reset link.";
      if (err.code === "auth/expired-action-code") {
        msg = "The reset link has expired.";
      } else if (err.code === "auth/invalid-action-code") {
        msg = "The reset link is invalid.";
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const verifyEmailAddress = useCallback(async (oobCode: string) => {
    setError(null);
    try {
      await applyActionCode(auth, oobCode);
      // Reload user to update emailVerified status
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setUser({ ...auth.currentUser });
      }
    } catch (err: any) {
      let msg = "Failed to verify email.";
      if (err.code === "auth/expired-action-code") {
        msg = "The verification link has expired.";
      } else if (err.code === "auth/invalid-action-code") {
        msg = "The verification link is invalid.";
      }
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const recoverEmail = useCallback(async (oobCode: string) => {
    setError(null);
    try {
      await checkActionCode(auth, oobCode);
      await applyActionCode(auth, oobCode);
      // Reload user
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setUser({ ...auth.currentUser });
      }
    } catch (err: any) {
      let msg = "Failed to recover email.";
      if (err.code === "auth/expired-action-code") {
        msg = "The recovery link has expired.";
      } else if (err.code === "auth/invalid-action-code") {
        msg = "The recovery link is invalid.";
      }
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setError(null);
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      }
    } catch (err: any) {
      let msg = "Failed to delete account.";
      if (err.code === "auth/requires-recent-login") {
        msg =
          "For security, please log out and log back in before deleting your account.";
      }
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const handleSocialLogin = async (provider: any) => {
    setError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithPopup(auth, provider);

      // Sync photoURL if missing or invalid but available in providerData
      const currentPhoto = result.user.photoURL;
      const isPhotoInvalid =
        !currentPhoto ||
        currentPhoto === "null" ||
        currentPhoto === "undefined" ||
        (currentPhoto.includes("facebook.com") && !currentPhoto.includes("?"));

      if (isPhotoInvalid && result.user.providerData.length > 0) {
        let photo = result.user.providerData.find(
          (p) =>
            p.photoURL && p.photoURL !== "null" && p.photoURL !== "undefined",
        )?.photoURL;
        if (photo) {
          if (photo.includes("facebook.com") && !photo.includes("?")) {
            photo += "?type=large";
          }
          await updateProfile(result.user, { photoURL: photo });
          await result.user.reload();
        }
      }

      // Force user state update
      setUser({ ...auth.currentUser! });

      // Strict requirement: Do not allow session if email is not verified
      // TEMPORARILY DISABLED: User reports valid email is being blocked.
      /*
        if (!result.user.emailVerified) {
             await signOut(auth);
             throw new Error("Your GitHub email is not verified. Please verify it on GitHub or use a different login method.");
        }
        */
    } catch (err: any) {
      console.error("Social login failed", err);
      let msg = "Failed to sign in.";
      if (err.code === "auth/account-exists-with-different-credential") {
        msg =
          "An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.";
      } else if (err.code === "auth/popup-closed-by-user") {
        msg = "Sign-in cancelled.";
      } else if (err.code === "auth/cancelled-popup-request") {
        msg = "Another popup is already open.";
      } else if (err.message && err.message.includes("not verified")) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = () => handleSocialLogin(googleProvider);
  const signInWithGithub = () => handleSocialLogin(githubProvider);
  const signInWithFacebook = () => handleSocialLogin(facebookProvider);

  const sendPasswordlessLink = async (email: string) => {
    setError(null);
    try {
      const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: `${window.location.origin}${import.meta.env.BASE_URL}#/auth/action?mode=signInWithEmailLink`,
        // This must be true.
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // Save the email locally so you don't need to ask the user for it again
      // if they open the link on the same device.
      window.localStorage.setItem("emailForSignIn", email);
    } catch (err: any) {
      console.error("Error sending passwordless link", err);
      let msg = "Failed to send login link.";
      if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.code === "auth/quota-exceeded") {
        msg = "We've reached our daily limit for sending login emails. Please try again tomorrow or use a different login method.";
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const completePasswordlessSignIn = async (email: string, link: string): Promise<string | undefined> => {
    setError(null);
    try {
      if (isSignInWithEmailLink(auth, link)) {
        await setPersistence(auth, browserLocalPersistence);
        const result = await signInWithEmailLink(auth, email, link);
        window.localStorage.removeItem("emailForSignIn");
        console.log("[AuthContext] Passwordless sign in successful for:", result.user.uid);
        return result.user.uid;
      }
      return undefined;
    } catch (err: any) {
      console.error("Error completing passwordless sign in", err);
      let msg = "Failed to sign in with link.";
      if (err.code === "auth/invalid-action-code") {
        msg = "The magic link is invalid or has already been used. Please request a new one.";
      } else if (err.code === "auth/expired-action-code") {
        msg = "The magic link has expired. Please request a new one.";
      } else if (err.code === "auth/invalid-email") {
        msg = "The email address does not match the link.";
      } else if (err.code === "auth/quota-exceeded") {
        msg = "We've reached our limit for today. Please try again tomorrow or use a different login method.";
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const resendVerification = async (email: string) => {
    setError(null);
    try {
      // We need the user object, which might not be global if they just failed login
      // However, if they just tried to login, they might still be the 'auth.currentUser' internally
      // for a brief moment before the signOut(auth) in the login function.
      // But we signed out already. So we need to re-authenticate or use a different approach.
      // Easiest is to tell them to use 'Forgot Password' which also verifies email access.
      // Alternatively, we can let them login if they have a social provider (already done above).

      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        throw new Error(
          "Please sign in first to request a verification email.",
        );
      }
    } catch (err: any) {
      let msg = "Failed to send verification email.";
      if (err.code === "auth/quota-exceeded") {
        msg = "Daily email limit reached. Please try again later or use 'Forgot Password'.";
      }
      setError(msg || err.message);
      throw new Error(msg || err.message);
    }
  };

  const changeEmail = useCallback(async (newEmail: string) => {
    setError(null);
    try {
      if (!auth.currentUser) throw new Error("No user logged in.");
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
    } catch (err: any) {
      let msg = "Failed to send email change verification.";
      if (err.code === "auth/requires-recent-login") {
        msg = "Security check: Please log out and log back in to change your email.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "This email address is already in use by another account.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.code === "auth/quota-exceeded") {
        msg = "Too many requests. Please try again later.";
      }
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updateUserPassword,
        updateName,
        deleteAccount,
        confirmReset,
        verifyResetCode,
        verifyEmailAddress,
        recoverEmail,
        signInWithGoogle,
        signInWithGithub,
        signInWithFacebook,
        sendPasswordlessLink,
        completePasswordlessSignIn,
        resendVerification,
        changeEmail,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
