import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function parseServiceAccount() {
  // Use environment variable if present (best for GitHub Actions)
  const envRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envRaw) {
    try {
      return JSON.parse(envRaw);
    } catch {
      console.warn("Warning: FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON.");
    }
  }

  // Use explicit path for local development
  const localPath = path.resolve(process.cwd(), "service-account.json");
  
  if (fs.existsSync(localPath)) {
    try {
      return JSON.parse(fs.readFileSync(localPath, "utf8"));
    } catch (error) {
      console.error(`Error reading service-account.json at ${localPath}:`, error.message);
    }
  }

  return null;
}

const serviceAccount = parseServiceAccount();

if (!serviceAccount?.project_id) {
  console.error(
    "Error: FIREBASE_SERVICE_ACCOUNT environment variable or service-account.json file is missing or invalid.",
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const DRY_RUN = process.env.DRY_RUN === "true";

async function cleanupGhostUsers() {
  console.log("Starting cleanup of unverified users...");

  let nextPageToken;
  let deletedCount = 0;
  const TWO_DAYS_IN_MS = 48 * 60 * 60 * 1000;
  const now = Date.now();

  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

    const usersToDelete = listUsersResult.users.filter((user) => {
      const creationTime = new Date(user.metadata.creationTime).getTime();
      const isOld = now - creationTime > TWO_DAYS_IN_MS;
      return !user.emailVerified && isOld;
    });

    for (const user of usersToDelete) {
      const email = user.email ?? "(no email)";
      const name = user.displayName ?? "(no name)";
      const uid = user.uid;

      if (!DRY_RUN) {
        try {
          await admin.auth().deleteUser(uid);
          console.log(`DELETED: ${email} | Name: ${name} | UID: ${uid}`);
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete user ${uid}:`, error.message);
        }
      } else {
        console.log(
          `[DRY RUN] Would delete: ${email} | Name: ${name} | UID: ${uid}`,
        );
        deletedCount++;
      }
    }

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`Cleanup complete. Deleted ${deletedCount} unverified users.`);
  process.exit(0);
}

cleanupGhostUsers().catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});
