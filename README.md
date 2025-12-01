# Virtual OS File Manager

This is a minimal React + TypeScript SPA that simulates a file manager in the browser with an in-memory data source.

Features:
- Recursive display of a folder/file tree
- Select files/folders, highlight selected item
- Add folder/file inside the selected folder or root
- Delete the selected item
- Rename by double-clicking and editing in-place
- Drag and drop using native HTML5 API to move files or folders

How to run:
1. Install dependencies:

```powershell
npm install
```

2. Start a dev server (not recommended to run from me; run it yourself):

```powershell
npm run start
```

Notes:
- The app does not connect to any backend or the OS file system. It uses the exact JSON initial data from `task1.txt`.
- No external UI libraries were used.
