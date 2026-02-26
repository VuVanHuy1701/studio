# Task Compass - Maintenance & Deployment Guide

This is a NextJS-based Progressive Web App (PWA) built with Firebase Studio. This guide explains how to manage and update your application.

## 🛠 How to Update the Application

Updates are handled conversationally through the **AI App Prototyper**.

### Modification Workflow:
1. **Request**: Describe your desired change in the chat (e.g., "Add a statistics chart to the dashboard").
2. **Generation**: The AI generates a `<changes>` block with the updated source code.
3. **Application**: Firebase Studio automatically applies these changes to the files in this directory.

### Key Directories:
- `src/app`: Routes, layouts, and page logic.
- `src/components`: UI components (Task cards, forms, navigation).
- `src/app/context`: Global state (Auth, Tasks, Settings).
- `src/app/lib`: Mock database files (`tasks.json`, `users.json`) and types.

## 🚀 Deployment (Publishing)

To make your changes visible on the live website:

1. **Commit Changes**: Use your Git tool to commit the files updated by the AI.
2. **Push to GitHub**: Push your commits to the branch connected to Firebase App Hosting (usually `main`).
3. **Auto-Deploy**: Firebase will detect the push, rebuild the app, and update your live URL automatically.

## 📊 Data Management

This prototype uses local JSON files as a database for speed and offline capability.
- **Location**: `src/app/lib/tasks.json` and `src/app/lib/users.json`.
- **Sync**: Changes made in the app are persisted to these files via Server Actions.
- **Backup**: Use the **Export/Import** buttons on the Dashboard to manage your data externally.

## 📱 PWA & Notifications

The app is a fully functional PWA.
- **Installation**: Users can "Add to Home Screen" on iOS/Android or "Install" on Chrome/Edge.
- **Notifications**: On-screen notifications are persistent. Admin alerts use color-coding (Green for completion, Yellow for progress) and stay visible until manually dismissed.
