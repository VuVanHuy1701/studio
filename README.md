# Task Compass - PWA Prototyping

This is a NextJS-based Progressive Web App (PWA) built with Firebase Studio.

## How to Update or Add Features

To modify this application, simply describe your desired changes to the **AI App Prototyper** in the chat interface. 

### Modification Workflow:
1. **Request**: Tell the AI what you want (e.g., "Add a priority filter to the tasks page").
2. **Generation**: The AI will generate a `<changes>` block containing the updated code.
3. **Application**: Firebase Studio automatically applies these changes to the source files in this directory.

### Key Directories:
- `src/app`: Contains routes, pages, and layouts.
- `src/components`: Reusable UI components (Tasks, Layout, ShadCN).
- `src/app/context`: Global state management for Authentication, Tasks, and Settings.
- `src/ai`: Genkit configurations for AI-powered features.
- `public`: Static assets, `manifest.json`, and the Service Worker (`sw.js`).

### PWA Features:
- **Installable**: Use "Add to Home Screen" on mobile.
- **Offline Support**: Basic caching via Service Worker.
- **Standalone Mode**: Hides browser UI when opened from the home screen.
