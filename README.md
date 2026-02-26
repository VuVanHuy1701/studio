# Task Compass - Maintenance & Deployment Guide

This is a NextJS-based Progressive Web App (PWA) built with Firebase Studio. This guide explains how to manage, update, and deploy your application.

## 🛠 How to Update the Application

Updates are handled conversationally through the **AI App Prototyper** within Firebase Studio.

### Modification Workflow:
1. **Request**: Describe your desired change in the chat (e.g., "Add a statistics chart to the dashboard").
2. **Generation**: The AI generates a `<changes>` block with the updated source code.
3. **Application**: Firebase Studio automatically applies these changes to the source files in this environment.

### 🔄 Updating After Publishing (Going Live)
You can update your program and source code at any time in Firebase Studio:
1. Use the chat to make and apply changes to your code.
2. **Commit & Push**: Use the Git tools in your environment to push the updated code to your GitHub repository.
3. **Auto-Deploy**: Firebase App Hosting detects the push to your `main` branch and automatically rebuilds and deploys the new version to your live URL.

## 📁 Key Directories:
- `src/app`: Routes, layouts, and page logic.
- `src/components`: UI components (Task cards, forms, navigation).
- `src/app/context`: Global state (Auth, Tasks, Settings, Notifications).
- `src/app/lib`: Mock database files (`tasks.json`, `users.json`) and types.

## 📊 Data Management
This prototype uses local JSON files as a database for speed and offline capability.
- **Location**: `src/app/lib/tasks.json` and `src/app/lib/users.json`.
- **Sync**: Changes made in the app are persisted to these files via Server Actions.

## 🔔 Notification System
The app features a custom on-screen notification system:
- **Users**: Receive 3-line alerts for new task assignments.
- **Administrators**: Receive 5-line alerts for task completions (Green border) or progress updates (Yellow border).
- **Persistence**: Notifications remain on screen until manually dismissed.
