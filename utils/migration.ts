/**
 * One-time data migration utility.
 *
 * Migrates data from the legacy single-document format (all data in one
 * `users/{uid}` doc) to the new subcollection-based format used by
 * household workspaces.
 *
 * Usage:
 *   import { migrateUserDataToSubcollections } from "../utils/migration";
 *   await migrateUserDataToSubcollections(user.uid);
 *
 * This is idempotent — calling it multiple times will not duplicate data.
 */

import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { AppState } from "../types";

/**
 * Check whether the user's data is in the legacy blob format.
 * Legacy format: the root doc contains arrays like `wallets`, `transactions`, etc.
 */
export const isLegacyFormat = async (uid: string): Promise<boolean> => {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;

  const data = snap.data();
  // Legacy format has `wallets` array directly on the doc
  return Array.isArray(data.wallets) && !data._migrated;
};

/**
 * Migrate a user's data from the single-document blob into Firestore
 * subcollections. This allows the data to work with household-style
 * workspace switching and future per-entity real-time listeners.
 *
 * Structure after migration:
 *   users/{uid}            → settings (currency, theme, etc.) + _migrated flag
 *   users/{uid}/wallets    → individual wallet docs
 *   users/{uid}/transactions → individual transaction docs
 *   users/{uid}/budgets    → individual budget docs
 *   users/{uid}/goals      → individual goal docs
 *   users/{uid}/shopping   → individual shopping item docs
 *   users/{uid}/recurring  → individual recurring transaction docs
 */
export const migrateUserDataToSubcollections = async (
  uid: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return { success: true, message: "No data to migrate (new user)." };
    }

    const data = snap.data() as AppState & { _migrated?: boolean };

    if (data._migrated) {
      return { success: true, message: "Already migrated." };
    }

    if (!Array.isArray(data.wallets)) {
      return {
        success: true,
        message: "Data is not in legacy format. No migration needed.",
      };
    }

    // Use batched writes for atomicity (max 500 writes per batch)
    const batches: ReturnType<typeof writeBatch>[] = [];
    let currentBatch = writeBatch(db);
    let opCount = 0;

    const flushIfNeeded = () => {
      if (opCount >= 450) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        opCount = 0;
      }
    };

    // Helper to write an array of entities to a subcollection
    const writeEntities = (subcollectionName: string, entities: any[]) => {
      for (const entity of entities) {
        const entityRef = doc(
          collection(db, "users", uid, subcollectionName),
          entity.id,
        );
        currentBatch.set(entityRef, entity);
        opCount++;
        flushIfNeeded();
      }
    };

    // Migrate each entity type
    if (data.wallets?.length) writeEntities("wallets", data.wallets);
    if (data.transactions?.length)
      writeEntities("transactions", data.transactions);
    if (data.budgets?.length) writeEntities("budgets", data.budgets);
    if (data.goals?.length) writeEntities("goals", data.goals);
    if (data.shoppingList?.length) writeEntities("shopping", data.shoppingList);
    if (data.recurringTransactions?.length)
      writeEntities("recurring", data.recurringTransactions);

    // Write settings doc (preferences only, no entity arrays)
    currentBatch.set(
      userRef,
      {
        currency: data.currency || "INR",
        theme: data.theme || "light",
        hideAmounts: data.hideAmounts || false,
        defaultWalletId: data.defaultWalletId || "",
        numberSystem: data.numberSystem || "AUTO",
        tourCompleted: data.tourCompleted || false,
        _migrated: true,
        _migratedAt: new Date().toISOString(),
        _legacyWalletCount: data.wallets?.length || 0,
        _legacyTxCount: data.transactions?.length || 0,
      },
      { merge: true },
    );
    opCount++;

    // Commit all batches
    batches.push(currentBatch);
    for (const batch of batches) {
      await batch.commit();
    }

    return {
      success: true,
      message: `Migration complete! Migrated ${data.wallets?.length || 0} wallets, ${data.transactions?.length || 0} transactions, ${data.budgets?.length || 0} budgets, ${data.goals?.length || 0} goals, ${data.shoppingList?.length || 0} shopping items, ${data.recurringTransactions?.length || 0} recurring rules.`,
    };
  } catch (error: any) {
    console.error("Migration failed:", error);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
    };
  }
};

/**
 * Read data from subcollections back into the AppState format.
 * This is the inverse of `migrateUserDataToSubcollections` and is used
 * by the DataContext when loading from subcollection-based storage.
 */
export const readSubcollectionData = async (
  basePath: string,
): Promise<Partial<AppState>> => {
  const readCollection = async (name: string) => {
    const colRef = collection(db, basePath, name);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  const [
    wallets,
    transactions,
    budgets,
    goals,
    shoppingList,
    recurringTransactions,
  ] = await Promise.all([
    readCollection("wallets"),
    readCollection("transactions"),
    readCollection("budgets"),
    readCollection("goals"),
    readCollection("shopping"),
    readCollection("recurring"),
  ]);

  return {
    wallets: wallets as any,
    transactions: transactions as any,
    budgets: budgets as any,
    goals: goals as any,
    shoppingList: shoppingList as any,
    recurringTransactions: recurringTransactions as any,
  };
};
