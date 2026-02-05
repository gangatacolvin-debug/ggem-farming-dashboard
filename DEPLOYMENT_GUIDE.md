# Deployment Guide: Firebase Hosting

This guide will show you how to deploy your application to the internet so others can view it. We will use **Firebase Hosting** since your app is already connected to Firebase.

## Prerequisites

1.  **Firebase CLI**: You need the tool to talk to Firebase.
2.  **Google Account**: The one you used to create your Firebase project.

---

## Step 1: Install & Login

Open your terminal (VS Code terminal is fine) and run these commands one by one:

1.  **Install the Firebase tools** (if you haven't already):
    ```powershell
    npm install -g firebase-tools
    ```

2.  **Login to your account**:
    ```powershell
    firebase login
    ```
    *   This will open a browser window. Sign in with the Google account associated with your Firebase project.

---

## Step 2: Initialize Hosting

Run this command in your project root folder:

```powershell
firebase init hosting
```

**Follow the interactive prompts carefully:**

1.  **"Are you ready to proceed?"** -> Type `y` and Enter.
2.  **"Please select an option:"** -> Select **"Use an existing project"** (since you already have one).
3.  **"Select a default Firebase project:"** -> Choose your project (likely `gangatacolvin-debug` or similar based on your previous messages).
4.  **"What do you want to use as your public directory?"** -> Type `dist` and Enter.
    *   *Important:* Vite builds your app into a folder named `dist`, so we must tell Firebase to look there.
5.  **"Configure as a single-page app (rewrite all urls to /index.html)?"** -> Type `y` and Enter.
    *   *Important:* This ensures your routing works (e.g., /dashboard, /login) works when users refresh the page.
6.  **"Set up automatic builds and deploys with GitHub?"** -> Type `n` for now.
    *   (You can set this up later if you want automatic updates when you push code).
7.  **"File dist/index.html already exists. Overwrite?"** -> Type `n` (No).
    *   We want to keep your built file, not replace it with a default Firebase placeholder.

---

## Step 3: Build & Deploy

Now that Firebase is configured, you can deploy your app.

1.  **Build the latest version** of your app:
    ```powershell
    npm run build
    ```
    *   This creates the optimized files in the `dist` folder.

2.  **Deploy to the internet**:
    ```powershell
    firebase deploy
    ```

---

## Success!

After the command finishes, it will print a **Hosting URL** (usually ending in `.web.app` or `.firebaseapp.com`).

**Send this URL to anyone for testing.**

---

## Future Updates

Whenever you make changes and want to update the live site, just run:

```powershell
npm run build
firebase deploy
```
