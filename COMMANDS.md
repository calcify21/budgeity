# 🚀 Project Commands Guide

This guide lists all the commands you can use in the **Budgeity** app, along with brief, one-liner descriptions and when to run them.

---

## 🛠️ Development & Emulators

| Command | Description | When to Use |
| :--- | :--- | :--- |
| `npm run dev` | Starts the Vite local development server. | During active front-end feature development. |
| `npm run dev:emu` | Starts the Vite dev server AND local Firebase emulators concurrently. | When testing features that interact with Firebase (Auth, Firestore, etc.). |
| `npm run emu` | Starts only the local Firebase emulators. | When you want to run or test Firebase emulators without the UI dev server. |
| `npm run preview` | Previews the built production app locally. | Before deploying, to verify that the production build works correctly. |

---

## 🌐 Internationalization (i18n) Workflow

> [!IMPORTANT]
> Always run `npm run tran:sync` after editing your JSON translation files to prevent TypeScript errors.

| Command | Description | When to Use |
| :--- | :--- | :--- |
| `npm run tran:sync` | Generates TypeScript types from `en/translation.json` into `types/i18n.d.ts`. | **Mandatory** immediately after adding, renaming, or deleting keys in the translation JSON files. |
| `npm run tran:check` | Scans the codebase for translation keys and generates a report in `logs/i18n_report.txt`. | To audit for missing or unused translation keys. |
| `npm run tran:clean` | Automatically deletes all unused translation keys flagged in the audit report. | To prune dead keys and keep the translation bundle size small. |

---

## 🔍 Code Quality & Error Checking

| Command | Description | When to Use |
| :--- | :--- | :--- |
| `npx tsc --noEmit` | Runs the TypeScript compiler check without generating build files. | **Use this instead of `npm run build`** to check for code and type errors quickly. |
| `npm run lint` | Runs ESLint to check for code style issues and unused disable directives. | To ensure code follows project guidelines and best practices. |

---

## 📦 Building & Deployment

> [!TIP]
> Service workers (PWA) **only activate in a production build**. In PowerShell run:
> ```powershell
> npm run build:f; npm run preview
> ```
> (On Unix shells you can still use `npm run build:f && npm run preview`.)

| Command | Description | When to Use |
| :--- | :--- | :--- |
| `npm run build:f` | Compiles TypeScript and builds the Vite production app for Firebase. | To build the app before deploying to Firebase. |
| `npm run build:h` | Compiles TypeScript and builds the Vite production app for Hostinger. | To build the app before deploying to Hostinger. |
| `npm run preview` | Previews the built production app locally. | To test the PWA, service worker, and offline support before deploying. |
| `npm run deploy` | Builds the app and deploys it to Firebase Hosting. | When you are ready to release a new version of the app to users. |
| `npm run deploy:r` | Deploys only the Firestore security rules. | When you have updated `firestore.rules` and want to push the security update. |

---

## 🧼 Housekeeping & Clean Up

| Command | Description | When to Use |
| :--- | :--- | :--- |
| `npm run depcheck` | Scans the workspace to identify unused or missing dependencies in `package.json`. | To find and prune dependencies you installed but are no longer importing in your code. |
| `npm install` | Restores all project dependencies under `node_modules`. | When you have just deleted `node_modules` or pulled new changes from git. |
| `npm prune` | Deletes any unused/orphaned packages inside `node_modules`. | When you want to clean up unused packages without doing a full reinstall. |
| `npm cache clean --force` | Clears the local npm cache. | If packages fail to download or installation errors occur. |
