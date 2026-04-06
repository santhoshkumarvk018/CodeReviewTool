# AI-Powered Code Review Tool

An intelligent code review assistant that integrates with VS Code to automatically detect bugs, improve code quality, and identify security risks using a combination of rule-based analysis and AI.

## 🚀 Features

- **VS Code Extension**: Trigger code reviews directly from your editor.
- **Rule-Based & ML Engine**: Instant detection of complex issues (e.g. O(N^2) time complexity, exception black holes, SQL injection, hardcoded secrets).
- **Gemini AI Integration**: Connects to `gemini-2.5-flash` for deep semantic code reviews and automatic language detection.
- **Dashboard**: A React-based web dashboard to view detailed historical reports and an interactive AI Chatbot.
- **Pure MongoDB Storage**: 100% NoSQL backend architecture with stateless JWT authentication.

## 🛠️ Tech Stack

- **Backend**: Django, Django REST Framework, PyMongo, PyJWT, bcrypt, google-generativeai
- **Frontend**: React, Vite, Axios
- **Extension**: TypeScript, VS Code API

## 📋 Prerequisites

- **Python** 3.8+
- **Node.js** 16+
- **MongoDB** (Ensure it's running locally on default port 27017)
- **Google API Key** (for Gemini AI)

## ⚡ Getting Started

### 1. Backend Setup (Django)

The backend handles the analysis logic, AI integration, and PyMongo API.

```bash
cd backend
python -m venv venv
# Activate Virtual Env:
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install Dependencies
pip install django djangorestframework pymongo python-dotenv django-cors-headers requests google-generativeai bcrypt pyjwt
```

**Configure Gemini API:**
Create a `.env` file inside the `backend/` directory and add your key:

```env
GOOGLE_API_KEY="your-google-api-key-here"
```

**Start Server:**

```bash
python manage.py runserver
```

_Backend runs at `http://127.0.0.1:8000/`_

### 2. Frontend Setup (React)

The frontend visualizes the review results.

```bash
cd frontend
npm install
npm run dev
```

_Frontend runs at `http://localhost:5173/`_

### 3. Running the VS Code Extension

**Option A: Run from Root (Recommended)**

1. Open the root `CodeReviewTool` folder in VS Code.
2. Go to the **Run and Debug** view (Ctrl+Shift+D).
3. Select **"Run Extension"** from the drop-down.
4. Press **F5**. This will compile and launch the extension correctly in a new dev window.

**Option B: Publish Extension manually**

1. Install VSCE globally: `npm install -g @vscode/vsce` inside the `extension` folder.
2. Package it: `vsce package`.
3. Upload the resulting `.vsix` file to the VS Code Marketplace!

## 🧠 How It Works

1. **Submission**: The VS Code Extension or React Dashboard sends code to the Django Backend via REST API.
2. **Analysis**:
   - The Backend receives the code and attempts to use the **Gemini 2.5 AI** to detect languages and deep structural flaws.
   - If AI is unavailable, it runs a **Heuristic ML Engine** to check for immediate issues (Time Complexity, Exceptions, etc.).
3. **Storage & Auth**:
   - The entire system operates statelessly. Users authenticate via **JWTs**.
   - All Users and Code Analysis reports are stored inside the `codereview_db` **MongoDB**.
4. **Presentation**:
   - The React Dashboard visually presents the issues and offers an interactive AI Chat widget to help fix your code!
