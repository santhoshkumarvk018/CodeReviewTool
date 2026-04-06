import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeCode } from "../api";
import {
  Play,
  LogOut,
  CheckCircle,
  MessageSquare,
  X,
  Send,
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    {
      role: "bot",
      text: "Hi! I am your AI Code Assistant. Have a question about your code?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const navigate = useNavigate();

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMsgs((prev) => [...prev, { role: "user", text: chatInput }]);
    setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      setChatMsgs((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I have analyzed your code structure. You can improve its readability by adhering to PEP-8 standards. Also, watch out for performance bottlenecks in nested loops!",
        },
      ]);
    }, 1000);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeCode(code, fileName || "snippet.py", "python");
      setResults(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard fade-in">
      <header className="header slide-down">
        <h1>AI Code Reviewer</h1>
        <button className="logout-btn" onClick={() => navigate("/login")}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <main className="main-content">
        <section className="input-section slide-right">
          <h2>Submit Code</h2>
          <div className="form-group">
            <label>File Name (Optional)</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., myscript.py"
            />
          </div>
          <div className="form-group">
            <label>Code Content</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={15}
              placeholder="Paste your python code here..."
              spellCheck={false}
              style={{ padding: "15px", lineHeight: "1.5" }}
            />
          </div>
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              "Analyzing..."
            ) : (
              <>
                <Play size={16} /> Analyze Code
              </>
            )}
          </button>
          {error && <div className="error-msg">{error}</div>}
        </section>

        {results ? (
          <section className="results-section slide-left">
            <h2>Analysis Results</h2>
            <div className="summary">
              <p>Issues Found: {results.results.length}</p>
            </div>
            <div className="issues-list">
              {results.results.length === 0 ? (
                <div className="no-issues scale-up">
                  <CheckCircle size={40} className="success-icon" />
                  <p>No issues found! Great job.</p>
                </div>
              ) : (
                results.results.map((issue, index) => (
                  <div
                    key={index}
                    className={`issue-card ${issue.severity.toLowerCase()} scale-up`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="issue-header">
                      <span className="issue-type">{issue.issue_type}</span>
                      <span className="issue-severity">{issue.severity}</span>
                      {issue.line_number && (
                        <span className="issue-line">
                          Line {issue.line_number}
                        </span>
                      )}
                    </div>
                    <p className="issue-message">{issue.message}</p>
                    {issue.suggestion && (
                      <div className="issue-suggestion">
                        <strong>Suggestion:</strong> {issue.suggestion}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="empty-state slide-up">
            <img
              src="/assets/empty_state.png"
              alt="AI analyzing code"
              className="empty-state-img floating"
            />
            <h3>Ready to analyze your code</h3>
            <p>
              Paste your Python snippet on the left and let AI find potential
              bugs, style issues, and security vulnerabilities.
            </p>
          </section>
        )}
      </main>
      {/* AI Chatbot Floating Widget */}
      <div className={`chatbot-widget ${showChat ? "open" : ""}`}>
        {!showChat ? (
          <button className="chat-toggle-btn" onClick={() => setShowChat(true)}>
            <MessageSquare size={24} />
          </button>
        ) : (
          <div className="chat-window fade-in">
            <div className="chat-header">
              <div className="chat-title">
                <MessageSquare size={18} />
                <span>AI Assistant</span>
              </div>
              <button className="chat-close" onClick={() => setShowChat(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="chat-messages">
              {chatMsgs.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form className="chat-input-form" onSubmit={handleSendChat}>
              <input
                type="text"
                placeholder="Ask AI about code..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" disabled={!chatInput.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
