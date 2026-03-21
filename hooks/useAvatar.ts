import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export function useAvatar() {
  const { user } = useAuth();
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setAvatarBase64(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Look in _meta.avatarBase64
          setAvatarBase64(data._meta?.avatarBase64 || null);
        } else {
          setAvatarBase64(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("useAvatar listener error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const saveAvatar = async (base64: string) => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        _meta: { avatarBase64: base64 }
      }, { merge: true });
    } catch (error) {
      console.error("Error saving avatar:", error);
      throw error;
    }
  };

  const removeAvatar = async () => {
    if (!user?.uid) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        _meta: { avatarBase64: null }
      }, { merge: true });
    } catch (error) {
      console.error("Error removing avatar:", error);
      throw error;
    }
  };

  const setProviderPhoto = async () => {
    if (!user?.uid) return;
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { _meta: { avatarBase64: null } }, { merge: true });
    } catch (error) {
      console.error("Error setting to Google Photo:", error);
      throw error;
    }
  };

  return { avatarBase64, loading, saveAvatar, removeAvatar, setProviderPhoto };
}
