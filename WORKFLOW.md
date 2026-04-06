# Project Workflow: AI Code Reviewer

This guide details the steps to run and maintain the project components: **Backend**, **Frontend**, and **VS Code Extension**.

## 1. Prerequisites

- **MongoDB**: Ensure a MongoDB instance is running locally at `mongodb://localhost:27017/`.
- **Node.js**: Version 18+ for Frontend and Extension.
- **Python**: Version 3.10+ for Backend.

---

## 2. Backend (Django)

The backend manages code analysis results and user authentication.

### **Setup & Run**

1. Navigate to `backend/`.
2. Activate the virtual environment:

   ```powershell
   .\venv\Scripts\activate
   ```

3. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

4. Start the server (on port 8000):

   ```powershell
   python manage.py runserver 8000
   ```

> [!NOTE]
> The backend connects to MongoDB on startup. Check the console for `Successfully connected to MongoDB database`.

---

## 3. Frontend (React + Vite)

The dashboard visualizes code analysis reports.

### **Setup & Run**

1. Navigate to `frontend/`.
2. Install dependencies:

   ```powershell
   npm install
   ```

3. Start the development server:

   ```powershell
   npm run dev
   ```

4. Open the dashboard at `http://localhost:5173/`.

---

## 4. VS Code Extension (TypeScript)

The extension allows developers to trigger code reviews directly from the editor.

### **Setup & Run (Development)**

1. Navigate to `extension/`.
2. Install dependencies:

   ```powershell
   npm install
   ```

3. Compile the extension:

   ```powershell
   npm run compile
   ```

4. Press `F5` in VS Code to open a new **Extension Development Host** window.

### **How to Use**

1. In the **Extension Development Host**, open any code file.
2. Select a code snippet or use the full file.
3. Right-click and choose **AI Code Review: Analyze Selection/File**.
4. View the results via VS Code notifications or click **View Dashboard**.

---

## 5. Publishing

To publish the extension to the Visual Studio Marketplace, please refer to the specialized guide:
- **[PUBLISHING.md](file:///d:/PROJECTS/CodeReviewTool/PUBLISHING.md)**: Detailed instructions for `vsce`, marketplace accounts, and tokens.

---

## 6. Maintenance

- **MongoDB Cleanup**: To clear all results, connect to your MongoDB instance and drop the `codereview_db` database.
- **Dependency Updates**: Keep `package.json` and `requirements.txt` updated to avoid security vulnerabilities.
