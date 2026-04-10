import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Household,
  HouseholdInvite,
  HouseholdMember,
  HouseholdRole,
  Workspace,
} from "../types";
import { useAuth } from "./AuthContext";
import { useAvatar } from "../hooks/useAvatar";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Unsubscribe,
} from "firebase/firestore";
import { generateId } from "../utils";
import { logActivity } from "../utils/activityLogger";

interface HouseholdContextType {
  // Active workspace
  activeWorkspace: Workspace;
  switchWorkspace: (workspace: Workspace) => void;

  // Households list
  households: Household[];
  isLoadingHouseholds: boolean;

  // Household CRUD
  createHousehold: (name: string, icon?: string) => Promise<string>;
  updateHousehold: (id: string, updates: Partial<Household>) => Promise<void>;
  deleteHousehold: (id: string) => Promise<void>;
  leaveHousehold: (id: string) => Promise<void>;

  // Members
  updateMemberRole: (
    householdId: string,
    targetUid: string,
    newRole: HouseholdRole,
  ) => Promise<void>;
  removeMember: (householdId: string, targetUid: string) => Promise<void>;

  // Invites
  inviteMember: (
    householdId: string,
    email: string,
    role: HouseholdRole,
  ) => Promise<void>;
  pendingInvites: HouseholdInvite[]; // Invites sent to the user
  householdInvites: HouseholdInvite[]; // Pending invites sent by the current household
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;

  // Current household helpers
  currentHousehold: Household | null;
  currentMembers: HouseholdMember[];
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(
  undefined,
);

const WORKSPACE_STORAGE_KEY = "budgeity_active_workspace";

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { avatarBase64 } = useAvatar();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoadingHouseholds, setIsLoadingHouseholds] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<HouseholdInvite[]>([]);
  const [householdInvites, setHouseholdInvites] = useState<HouseholdInvite[]>(
    [],
  );
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(() => {
    const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through
      }
    }
    return { type: "personal", id: "", name: "Personal" };
  });

  // ── Listen to households where user is a member ──────────────────
  useEffect(() => {
    if (!user) {
      setHouseholds([]);
      setIsLoadingHouseholds(false);
      return;
    }

    setIsLoadingHouseholds(true);

    // Query all households where user.uid appears in members array
    // We use the 'memberUids' index for efficient and secure lookup
    const q = query(
      collection(db, "households"),
      where("memberUids", "array-contains", user.uid),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const results: Household[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() } as Household);
        });
        setHouseholds(results);
        setIsLoadingHouseholds(false);
      },
      (error) => {
        console.error("Error listening to households:", error);
        setIsLoadingHouseholds(false);
      },
    );

    return () => unsub();
  }, [user]);

  // ── Sync profile changes to all household member entries ─────────
  useEffect(() => {
    if (!user || households.length === 0) return;

    const currentName = user.displayName || "User";
    const currentPhoto = user.photoURL || "";

    households.forEach(async (household) => {
      const myEntry = household.members.find((m) => m.uid === user.uid);
      if (!myEntry) return;

      // Check if anything actually changed
      const nameChanged = myEntry.displayName !== currentName;
      const photoChanged = myEntry.photoURL !== currentPhoto;
      const avatarChanged = (myEntry as any).avatarBase64 !== (avatarBase64 || null);

      if (!nameChanged && !photoChanged && !avatarChanged) return;

      // Build updated members array
      const updatedMembers = household.members.map((m) =>
        m.uid === user.uid
          ? {
              ...m,
              displayName: currentName,
              photoURL: currentPhoto,
              avatarBase64: avatarBase64 || null,
            }
          : m,
      );

      try {
        const householdRef = doc(db, "households", household.id);
        await updateDoc(householdRef, { members: updatedMembers });
      } catch (err) {
        console.warn("Failed to sync profile to household:", household.id, err);
      }
    });
  }, [user?.displayName, user?.photoURL, avatarBase64, households]);

  // ── Listen to pending invites for current user ───────────────────
  useEffect(() => {
    if (!user?.email) {
      setPendingInvites([]);
      return;
    }

    const q = query(
      collection(db, "householdInvites"),
      where("invitedEmail", "==", user.email),
      where("status", "==", "pending"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const invites: HouseholdInvite[] = [];
      snapshot.forEach((docSnap) => {
        invites.push({ id: docSnap.id, ...docSnap.data() } as HouseholdInvite);
      });
      // Filter expired invites
      const now = new Date().toISOString();
      setPendingInvites(invites.filter((inv) => inv.expiresAt > now));
    });

    return () => unsub();
  }, [user?.email]);

  // ── Listen to pending invites for current household ───────────────────
  useEffect(() => {
    if (!user || activeWorkspace.type !== "household" || !activeWorkspace.id) {
      setHouseholdInvites([]);
      return;
    }

    const q = query(
      collection(db, "householdInvites"),
      where("householdId", "==", activeWorkspace.id),
      where("status", "==", "pending"),
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const invites: HouseholdInvite[] = [];
        snapshot.forEach((docSnap) => {
          invites.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as HouseholdInvite);
        });
        // Filter expired invites
        const now = new Date().toISOString();
        setHouseholdInvites(invites.filter((inv) => inv.expiresAt > now));
      },
      (error) => {
        console.error("Error listening to household invites:", error);
      },
    );

    return () => unsub();
  }, [user, activeWorkspace]);

  // ── Set personal workspace ID when user loads ────────────────────
  useEffect(() => {
    if (user && activeWorkspace.type === "personal" && !activeWorkspace.id) {
      const ws: Workspace = {
        type: "personal",
        id: user.uid,
        name: "Personal",
      };
      setActiveWorkspace(ws);
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(ws));
    }
  }, [user, activeWorkspace]);

  // ── Sync active workspace with household changes ──────────────────
  useEffect(() => {
    if (activeWorkspace.type === "household" && !isLoadingHouseholds) {
      const match = households.find((h) => h.id === activeWorkspace.id);
      if (match) {
        if (match.name !== activeWorkspace.name) {
          const updated = { ...activeWorkspace, name: match.name };
          setActiveWorkspace(updated);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(updated));
        }
      } else if (user) {
        // The user is no longer a member of this household or it was deleted
        const personal: Workspace = {
          type: "personal",
          id: user.uid,
          name: "Personal",
        };
        setActiveWorkspace(personal);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(personal));
      }
    }
  }, [households, activeWorkspace, isLoadingHouseholds, user]);

  // ── Workspace switching ──────────────────────────────────────────
  const switchWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, []);

  // ── Household CRUD ───────────────────────────────────────────────
  const createHousehold = useCallback(
    async (name: string, icon?: string): Promise<string> => {
      if (!user) throw new Error("Not authenticated");
      const id = generateId();
      const household: Omit<Household, "id"> = {
        name,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        currency: "INR",
        icon: icon || "🏠",
        members: [
          {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "You",
            photoURL: user.photoURL || "",
            role: "owner",
            joinedAt: new Date().toISOString(),
            status: "active",
          },
        ],
        memberUids: [user.uid],
        memberRoles: { [user.uid]: "owner" },
      };
      await setDoc(doc(db, "households", id), household);
      await logActivity(id, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "household_create",
        metadata: { name },
      });
      return id;
    },
    [user],
  );

  const updateHousehold = useCallback(
    async (id: string, updates: Partial<Household>) => {
      if (!user) throw new Error("Not authenticated");
      const { id: _, ...safeUpdates } = updates as any;
      await updateDoc(doc(db, "households", id), safeUpdates);
      await logActivity(id, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "household_edit",
        metadata: { updates: Object.keys(safeUpdates) },
      });
    },
    [user],
  );

  const deleteHousehold = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      await logActivity(id, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "household_delete",
        metadata: {},
      });
      await deleteDoc(doc(db, "households", id));
      // Switch back to personal if deleting active household
      if (activeWorkspace.type === "household" && activeWorkspace.id === id) {
        const personal: Workspace = {
          type: "personal",
          id: user.uid,
          name: "Personal",
        };
        switchWorkspace(personal);
      }
    },
    [user, activeWorkspace, switchWorkspace],
  );

  const leaveHousehold = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const docRef = doc(db, "households", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Household not found");
      const data = snap.data() as Omit<Household, "id">;
      const updatedMembers = data.members.map((m) =>
        m.uid === user.uid ? { ...m, status: "removed" as const } : m,
      );
      const updatedRoles = { ...data.memberRoles };
      delete updatedRoles[user.uid];

      await logActivity(id, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "member_leave",
      });
      await updateDoc(docRef, {
        members: updatedMembers,
        memberUids: data.memberUids.filter((uid) => uid !== user.uid),
        memberRoles: updatedRoles,
      });
      if (activeWorkspace.type === "household" && activeWorkspace.id === id) {
        switchWorkspace({
          type: "personal",
          id: user.uid,
          name: "Personal",
        });
      }
    },
    [user, activeWorkspace, switchWorkspace],
  );

  // ── Member Management ────────────────────────────────────────────
  const updateMemberRole = useCallback(
    async (householdId: string, targetUid: string, newRole: HouseholdRole) => {
      if (!user) throw new Error("Not authenticated");
      const docRef = doc(db, "households", householdId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Household not found");
      const data = snap.data() as Omit<Household, "id">;
      const updatedMembers = data.members.map((m) =>
        m.uid === targetUid ? { ...m, role: newRole } : m,
      );
      await updateDoc(docRef, {
        members: updatedMembers,
        memberRoles: { ...data.memberRoles, [targetUid]: newRole },
      });
      await logActivity(householdId, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "role_change",
        metadata: { targetUid, newRole },
      });
    },
    [user],
  );

  const removeMember = useCallback(
    async (householdId: string, targetUid: string) => {
      if (!user) throw new Error("Not authenticated");
      const docRef = doc(db, "households", householdId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Household not found");
      const data = snap.data() as Omit<Household, "id">;
      const updatedMembers = data.members.map((m) =>
        m.uid === targetUid ? { ...m, status: "removed" as const } : m,
      );
      const updatedRoles = { ...data.memberRoles };
      delete updatedRoles[targetUid];

      await updateDoc(docRef, {
        members: updatedMembers,
        memberUids: data.memberUids.filter((uid) => uid !== targetUid),
        memberRoles: updatedRoles,
      });
      await logActivity(householdId, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "member_remove",
        metadata: { targetUid },
      });
    },
    [user],
  );

  // ── Invites ──────────────────────────────────────────────────────
  const inviteMember = useCallback(
    async (householdId: string, email: string, role: HouseholdRole) => {
      if (!user) throw new Error("Not authenticated");
      const household = households.find((h) => h.id === householdId);
      if (!household) throw new Error("Household not found");

      // Check if already a member
      if (
        household.members.some(
          (m) => m.email === email && m.status === "active",
        )
      ) {
        throw new Error("This person is already a member");
      }

      const invite: Omit<HouseholdInvite, "id"> = {
        householdId,
        householdName: household.name,
        invitedEmail: email.toLowerCase().trim(),
        invitedBy: user.uid,
        invitedByName: user.displayName || user.email || "Someone",
        role,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: "pending",
      };

      await addDoc(collection(db, "householdInvites"), invite);
      await logActivity(householdId, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "member_invite",
        metadata: { invitedEmail: email.toLowerCase().trim(), role },
      });
    },
    [user, households],
  );

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      if (!user) throw new Error("Not authenticated");
      const inviteRef = doc(db, "householdInvites", inviteId);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) throw new Error("Invite not found");
      const invite = inviteSnap.data() as HouseholdInvite;

      if (invite.status !== "pending") return;

      const newMember: HouseholdMember = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "User",
        photoURL: user.photoURL || "",
        role: invite.role,
        joinedAt: new Date().toISOString(),
        status: "active",
      };

      const householdRef = doc(db, "households", invite.householdId);
      await updateDoc(householdRef, {
        members: arrayUnion(newMember),
        memberUids: arrayUnion(user.uid),
        [`memberRoles.${user.uid}`]: invite.role,
      });

      await updateDoc(inviteRef, { status: "accepted" });

      await logActivity(invite.householdId, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "member_join",
        metadata: { role: invite.role },
      });
    },
    [user],
  );
  const declineInvite = useCallback(async (inviteId: string) => {
    const inviteRef = doc(db, "householdInvites", inviteId);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) return;
    const invite = snap.data() as HouseholdInvite;
    
    if (user) {
      await logActivity(invite.householdId, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "member_invite_decline",
        metadata: { invitedEmail: invite.invitedEmail },
      });
    }

    await updateDoc(inviteRef, { status: "declined" });
  }, [user]);

  const cancelInvite = useCallback(async (inviteId: string) => {
    const inviteRef = doc(db, "householdInvites", inviteId);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) return;
    const invite = snap.data() as HouseholdInvite;

    if (user) {
      await logActivity(invite.householdId, {
        actorUid: user.uid,
        actorName: user.displayName || "Unknown",
        actionType: "member_invite_cancel",
        metadata: { invitedEmail: invite.invitedEmail },
      });
    }

    await deleteDoc(inviteRef);
  }, [user]);

  // ── Current household helpers ────────────────────────────────────
  const currentHousehold =
    activeWorkspace.type === "household"
      ? households.find((h) => h.id === activeWorkspace.id) || null
      : null;

  const currentMembers =
    currentHousehold?.members.filter((m) => m.status === "active") || [];

  return (
    <HouseholdContext.Provider
      value={{
        activeWorkspace,
        switchWorkspace,
        households,
        isLoadingHouseholds,
        createHousehold,
        updateHousehold,
        deleteHousehold,
        leaveHousehold,
        updateMemberRole,
        removeMember,
        inviteMember,
        pendingInvites,
        householdInvites,
        acceptInvite,
        declineInvite,
        cancelInvite,
        currentHousehold,
        currentMembers,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (!context)
    throw new Error("useHousehold must be used within a HouseholdProvider");
  return context;
};
