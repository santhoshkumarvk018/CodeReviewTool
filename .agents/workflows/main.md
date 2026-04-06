---
description: Main Project Maintenance and Common Tasks
---

# Project Workflow: AI Code Reviewer Management

Follow these steps to manage the AI Code Reviewer project components effectively.

## 1. Start Backend (Django)

Ensure that the backend is running to receive and process code analysis requests.

1. Navigate to the `backend/` directory.

1. Activate the virtual environment:

   ```powershell
   .\venv\Scripts\activate
   ```

// turbo

1. Start the Django development server on port 8000:

   ```powershell
   python manage.py runserver 8000
   ```

## 2. Start Frontend (React + Vite)

Ensure the dashboard is available for visualization.

1. Navigate to the `frontend/` directory.

// turbo

1. Start the development server (default port 5173):

   ```powershell
   npm run dev
   ```

## 3. Extension Compilation

Run this step if you have modified any extension source code.

1. Navigate to the `extension/` directory.

// turbo

1. Compile the TypeScript sources:

   ```powershell
   npm run compile
   ```

## 4. Maintenance: Database Flush

Use this to remove all current analysis data from MongoDB for testing purposes.

1. Connect to MongoDB.

// turbo

1. Drop the `codereview_db` database:

   ```powershell
   mongo --eval "db.getSiblingDB('codereview_db').dropDatabase()"
   ```

## 5. Maintenance: Check Model Health

Verify that the Gemini API is responding correctly.

1. Navigate to the `backend/` directory.

// turbo

1. Run a diagnostic check on `analysis.py`.
