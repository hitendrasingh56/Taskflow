# Taskflow — Personal Task Manager

A lightweight, responsive task manager with task editing, completion tracking, due-date status, a calendar, and progress summaries.

## Features

- Create, edit, complete, reopen, and delete tasks.
- Set a due date and priority (high, medium, low).
- Automatic task states: **Due today**, **Overdue**, **Pending/upcoming**, and **Completed**.
- Dashboard metrics: total tasks, due today, overdue, completed, and completion rate.
- Monthly calendar with task markers and a selected-day task list.
- Search and sort tasks.
- Responsive layout for desktop, tablet, and mobile.
- Tasks are saved in the browser using `localStorage`.

## Run locally

No build step or package installation is required.

1. Download and unzip the project.
2. Open the folder.
3. Double-click `index.html`, or run a local static server:

   ```bash
   python -m http.server 8000
   ```

4. Visit `http://localhost:8000`.

## Publish to GitHub

1. Create a new empty repository on GitHub.
2. Extract this ZIP file.
3. Upload the contents of the extracted folder to the repository root (make sure `index.html` is at the root).
4. Commit the files.

## Deploy to Vercel

1. Sign in to [Vercel](https://vercel.com/) with GitHub.
2. Select **Add New → Project** and import your repository.
3. Framework preset: **Other**.
4. Build command: leave blank.
5. Output directory: leave as `.` (or the default static output).
6. Click **Deploy**.

Vercel will serve this as a static website. Future GitHub commits can trigger automatic redeployments.

## Important data note

This starter version stores tasks in the browser on the device/browser where you use it. It does **not** include user accounts or cloud sync. Clearing browser storage or using another browser/device will not carry tasks across. For multi-device access, sign-in, and shared data, add a database/backend such as Supabase in a later version.

## Project structure

```text
taskflow-task-manager/
├── index.html
├── styles.css
├── app.js
├── vercel.json
└── README.md
```
