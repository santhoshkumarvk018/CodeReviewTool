import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { analyzeCode, getAnalysis, getHistory, trainModel, getMLStatus } from "../api";
import {
  Code2, Play, History, MessageSquare, X, Send, AlertCircle,
  CheckCircle2, User, Globe, Zap, Download, Copy, Trash2,
  ShieldAlert, TrendingUp, BarChart2, Activity, FileCode,
  Brain, RefreshCw, FileJson, FileDown
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import { jsPDF } from "jspdf";
import "./Dashboard.css";

/* ─── constants ─── */
const SEV_COLOR  = { CRITICAL:"#ef4444", HIGH:"#f97316", MEDIUM:"#eab308", LOW:"#22c55e" };
const TYPE_COLOR = { SECURITY:"#818cf8", BUG:"#f87171", PERFORMANCE:"#34d399", STYLE:"#60a5fa", BEST_PRACTICE:"#a78bfa", DEAD_CODE:"#94a3b8" };
const SEVERITIES = ["CRITICAL","HIGH","MEDIUM","LOW"];
const TYPES      = ["SECURITY","BUG","PERFORMANCE","STYLE","BEST_PRACTICE","DEAD_CODE"];

/* ─── helpers ─── */
const riskScore = (issues=[]) =>
  Math.min(100, issues.reduce((s,i) => s + ({CRITICAL:40,HIGH:20,MEDIUM:10,LOW:5}[i.severity?.toUpperCase()]||0), 0));

const riskLabel = (score) =>
  score > 60 ? "Critical Risk" : score > 30 ? "Moderate Risk" : score > 0 ? "Low Risk" : "Secure";

const qualColor = (q) => q >= 80 ? "#22c55e" : q >= 55 ? "#eab308" : "#ef4444";

/* ─── CircularGauge ─── */
const CircularGauge = ({ value, label, color }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 36 36" className="gauge-svg">
        <path className="gauge-bg" d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"/>
        <path className="gauge-fill" stroke={color} strokeDasharray={`${pct}, 100`}
          d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"/>
        <text x="18" y="20.35" className="gauge-text">{pct}</text>
      </svg>
      <span className="gauge-label">{label}</span>
    </div>
  );
};

/* ═══════════════════════════════════ DASHBOARD ══════════════════════════════ */
export default function Dashboard() {
  const [code, setCode]           = useState("");
  const [fileName, setFileName]   = useState("");
  const [language, setLanguage]   = useState("auto");
  const [results, setResults]     = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [filterSev, setFilterSev] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [activeTab, setActiveTab] = useState("findings");
  const [copied, setCopied]       = useState(false);
  const [showChat, setShowChat]   = useState(false);
  const [chatMsgs, setChatMsgs]   = useState([
    { role:"bot", text:"Hi! I'm your AI Security Expert. Run an analysis and I'll explain every finding." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [mlStatus, setMlStatus]   = useState({ trained:false });
  const [mlTraining, setMlTraining] = useState(false);
  const [mlResult, setMlResult]   = useState(null);

  const chatEndRef = useRef(null);
  const location   = useLocation();

  /* languages */
  const LANGS = [
    {value:"auto",  label:"🌐 Auto-detect"},
    {value:"python",label:"🐍 Python"},
    {value:"javascript",label:"🟨 JavaScript"},
    {value:"typescript",label:"🔷 TypeScript"},
    {value:"java",  label:"☕ Java"},
    {value:"cpp",   label:"⚙️ C++"},
    {value:"go",    label:"🐹 Go"},
    {value:"rust",  label:"🦀 Rust"},
    {value:"php",   label:"🐘 PHP"},
  ];

  /* ── effects ── */
  useEffect(() => { fetchHistory(); fetchMLStatus(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("id");
    if (id) loadById(id);
  }, [location]);

  /* ── data fetchers ── */
  const fetchHistory  = async () => { try { setHistory(await getHistory()); } catch { /* silent */ } };
  const fetchMLStatus = async () => { try { setMlStatus(await getMLStatus()); } catch { /* silent */ } };

  const loadById = async (id) => {
    setLoading(true);
    try {
      const d = await getAnalysis(id);
      setResults(d); setCode(d.code_content||""); setFileName(d.file_name||""); setLanguage(d.language||"auto");
    } catch { setError("Could not load scan."); }
    finally  { setLoading(false); }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setLoading(true); setError(null); setResults(null);
    try {
      const d = await analyzeCode(code, fileName||"snippet", language);
      setResults(d); setActiveTab("findings"); fetchHistory();
    } catch { setError("Analysis failed — is the backend running on :8000?"); }
    finally { setLoading(false); }
  };

  const handleTrainML = async () => {
    setMlTraining(true); setMlResult(null);
    try {
      const r = await trainModel();
      setMlResult(r); fetchMLStatus();
      setChatMsgs(p => [...p, { role:"bot", text: r.success
        ? `✅ ML model trained! Accuracy: ${r.accuracy}%, F1: ${r.f1_high_risk}% on ${r.samples} samples.`
        : `⚠️ ${r.message}` }]);
    } catch { setMlResult({ success:false, message:"Training request failed." }); }
    finally { setMlTraining(false); }
  };

  /* ── copy / export ── */
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const exportJSON = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results,null,2)], {type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {href:url, download:`review_${Date.now()}.json`});
    a.click(); URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!results) return;
    const doc  = new jsPDF();
    const issues = results.results || [];
    let y = 20;

    // Title
    doc.setFontSize(18); doc.setTextColor(99, 102, 241);
    doc.text("AI Code Review Report", 14, y); y += 10;

    // Meta
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`File: ${results.file_name || "N/A"}  |  Language: ${results.detected_language || "N/A"}  |  Date: ${new Date().toLocaleString()}`, 14, y); y += 6;
    doc.text(`Quality Score: ${results.quality_score ?? "N/A"}/100  |  Risk Score: ${riskScore(issues)}/100`, 14, y); y += 4;
    doc.setDrawColor(200); doc.line(14, y, 196, y); y += 6;

    // Summary
    if (results.summary) {
      doc.setFontSize(9); doc.setTextColor(60);
      const lines = doc.splitTextToSize(`Summary: ${results.summary}`, 180);
      doc.text(lines, 14, y); y += lines.length * 5 + 4;
    }

    // Issues header
    doc.setFontSize(12); doc.setTextColor(30);
    doc.text(`Findings (${issues.length})`, 14, y); y += 8;

    // Issues
    issues.forEach((issue, idx) => {
      if (y > 265) { doc.addPage(); y = 20; }
      const sevClr = {CRITICAL:[239,68,68],HIGH:[249,115,22],MEDIUM:[234,179,8],LOW:[34,197,94]}[issue.severity?.toUpperCase()]||[100,100,100];
      doc.setFillColor(...sevClr); doc.rect(14, y-3, 3, 6, "F");
      doc.setFontSize(10); doc.setTextColor(20);
      doc.text(`${idx+1}. [${issue.severity}] ${issue.issue_type}${issue.line_number ? ` — Line ${issue.line_number}` : ""}`, 20, y);
      y += 5;
      doc.setFontSize(9); doc.setTextColor(60);
      const msgLines = doc.splitTextToSize(issue.message, 170);
      doc.text(msgLines, 20, y); y += msgLines.length * 4 + 2;
      if (issue.suggestion) {
        doc.setTextColor(90);
        const fixLines = doc.splitTextToSize(`Fix: ${issue.suggestion}`, 170);
        doc.text(fixLines, 20, y); y += fixLines.length * 4 + 4;
      }
    });

    // Metrics
    if (results.metrics && Object.keys(results.metrics).length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12); doc.setTextColor(30);
      doc.text("Code Metrics", 14, y); y += 8;
      doc.setFontSize(9); doc.setTextColor(60);
      Object.entries(results.metrics).forEach(([k,v]) => {
        doc.text(`• ${k.replace(/_/g," ")}: ${v}`, 20, y); y += 5;
      });
    }

    doc.save(`code_review_${Date.now()}.pdf`);
  };

  /* ── chat ── */
  const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const input = chatInput;
    setChatMsgs(p => [...p, {role:"user", text:input}]);
    setChatInput("");
    setTimeout(() => {
      const top = results?.results?.[0];
      const botReply = results
        ? `Based on your scan: ${results.results?.length||0} issues found. Top concern: "${top?.message||"None"}" — Fix: ${top?.suggestion||"N/A"}`
        : "Run an analysis first, then ask me about specific findings or what to fix first.";
      setChatMsgs(p => [...p, {role:"bot", text:botReply}]);
    }, 700);
  };

  /* ── derived ── */
  const issues       = results?.results || [];
  const score        = riskScore(issues);
  const label        = riskLabel(score);
  const qualScore    = results?.quality_score ?? null;
  const mlPred       = results?.ml_prediction;

  const sevCounts    = SEVERITIES.reduce((a,s)=>({...a,[s]:issues.filter(i=>i.severity?.toUpperCase()===s).length}),{});
  const pieData      = SEVERITIES.map(s=>({name:s,value:sevCounts[s],color:SEV_COLOR[s]})).filter(d=>d.value>0);
  const typeCounts   = TYPES.reduce((a,t)=>({...a,[t]:issues.filter(i=>i.issue_type?.toUpperCase()===t).length}),{});
  const barData      = Object.entries(typeCounts).filter(([,v])=>v>0).map(([n,v])=>({name:n,value:v,fill:TYPE_COLOR[n]}));
  const filtered     = issues.filter(i => (filterSev==="ALL"||i.severity?.toUpperCase()===filterSev) && (filterType==="ALL"||i.issue_type?.toUpperCase()===filterType));

  /* ════════════════ RENDER ════════════════ */
  return (
    <div className="dashboard">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <ShieldAlert size={22} className="brand-icon" />
          <span>AI Reviewer</span>
        </div>

        <div className="sidebar-section-label">Scan History</div>
        <div className="history-list">
          {history.length === 0
            ? <p className="empty-hist">No scans yet</p>
            : history.map(item => (
              <div key={item.id}
                className={`history-item ${results?.id===item.id?"active":""}`}
                onClick={()=>loadById(item.id)}
              >
                <div className="hist-name"><FileCode size={11}/> {item.file_name}</div>
                <div className="hist-meta">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  {item.quality_score!=null&&<span className="hist-q" style={{color:qualColor(item.quality_score)}}>Q:{item.quality_score}</span>}
                </div>
              </div>
            ))
          }
        </div>

        {/* ML Panel */}
        <div className="ml-panel">
          <div className="ml-status">
            <Brain size={14} className={mlStatus.trained?"ml-icon trained":"ml-icon"}/>
            <span>{mlStatus.trained ? "Model Ready" : "Not Trained"}</span>
          </div>
          <button className={`ml-train-btn ${mlTraining?"loading":""}`} onClick={handleTrainML} disabled={mlTraining}>
            {mlTraining ? <><RefreshCw size={13} className="spinning"/> Training...</> : <><Brain size={13}/> Train ML</>}
          </button>
          {mlResult && (
            <div className={`ml-result ${mlResult.success?"success":"warn"}`}>
              {mlResult.success
                ? `✓ ${mlResult.accuracy}% acc · ${mlResult.samples} samples`
                : mlResult.message}
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-wrapper">

        {/* top bar */}
        <header className="top-bar">
          <div className="topbar-brand">
            <Code2 size={18} color="#818cf8"/>
            <span className="topbar-title">AI Code Reviewer</span>
          </div>
          <div className="topbar-right">
            {mlStatus.trained && <span className="ml-badge"><Brain size={11}/> ML Active</span>}
            <span className="topbar-user"><User size={14}/> Developer</span>
          </div>
        </header>

        <div className="content-grid">

          {/* ── RISK OVERVIEW ── */}
          {results && (
            <div className="risk-card slide-down">
              <div className="risk-card-header">
                <h3><Activity size={16}/> Risk &amp; Quality Overview</h3>
                <div className="risk-actions">
                  <span className={`risk-badge badge-${label.split(" ")[0].toLowerCase()}`}>{label}</span>
                  <button className="action-btn" title="Export PDF"  onClick={exportPDF}><Download size={14}/> PDF</button>
                  <button className="action-btn" title="Export JSON" onClick={exportJSON}><FileJson size={14}/> JSON</button>
                </div>
              </div>

              {results.summary && <p className="ai-summary">💡 {results.summary}</p>}

              {/* ML prediction badge */}
              {mlPred?.available && (
                <div className={`ml-pred-bar ${mlPred.prediction==="High Risk"?"danger":"safe"}`}>
                  <Brain size={14}/>
                  ML Model: <strong>{mlPred.prediction}</strong> — {mlPred.confidence}% confidence
                  &nbsp;(high-risk probability: {mlPred.high_risk_probability}%)
                </div>
              )}

              <div className="overview-stats">
                <CircularGauge value={score}     label="Risk Score"    color={SEV_COLOR.CRITICAL}/>
                {qualScore!=null && <CircularGauge value={qualScore} label="Quality Score" color={qualColor(qualScore)}/>}

                {/* Pie */}
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={pieData} innerRadius={42} outerRadius={64} paddingAngle={4} dataKey="value">
                        {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                      </Pie>
                      <Tooltip contentStyle={{background:"#1e293b",border:"none",borderRadius:8,fontSize:11}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="chart-label">Severity</p>
                </div>

                {/* Bar */}
                {barData.length>0 && (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={barData} margin={{top:5,right:5,left:-22,bottom:5}}>
                        <XAxis dataKey="name" tick={{fontSize:8,fill:"#64748b"}} interval={0} angle={-25} textAnchor="end"/>
                        <YAxis allowDecimals={false} tick={{fontSize:9,fill:"#64748b"}}/>
                        <Tooltip contentStyle={{background:"#1e293b",border:"none",borderRadius:8,fontSize:11}}/>
                        <Bar dataKey="value" radius={[4,4,0,0]}>{barData.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="chart-label">By Type</p>
                  </div>
                )}

                {/* Legend */}
                <div className="sev-legend">
                  {SEVERITIES.map(s=>(
                    <div className="legend-row" key={s}>
                      <span className="leg-dot" style={{background:SEV_COLOR[s]}}/>
                      <span className="leg-name">{s}</span>
                      <span className="leg-count">{sevCounts[s]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EDITOR ── */}
          <div className="editor-card">
            <div className="card-header">
              <h3><Code2 size={16}/> Code Editor</h3>
              <div className="card-actions">
                <select className="lang-select" value={language} onChange={e=>setLanguage(e.target.value)}>
                  {LANGS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button className="icon-btn" title={copied?"Copied!":"Copy"} onClick={handleCopy}>
                  <Copy size={13}/>{copied?" ✓":""}
                </button>
                <button className="icon-btn danger-btn" title="Clear" onClick={()=>{setCode("");setResults(null);}}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>

            <input
              className="filename-input"
              placeholder="filename.py  (optional)"
              value={fileName}
              onChange={e=>setFileName(e.target.value)}
            />
            <textarea
              className="code-area"
              placeholder="Paste any code — Python, JS, Java, Go, Rust, PHP…"
              value={code}
              onChange={e=>setCode(e.target.value)}
              spellCheck={false}
            />
            <button className="run-btn" onClick={handleAnalyze} disabled={loading||!code.trim()}>
              {loading
                ? <><Zap size={15} className="spinning"/> Analyzing…</>
                : <><Play size={15}/> Run Deep AI Review</>}
            </button>
            {error && <p className="err-msg">{error}</p>}
          </div>

          {/* ── RESULTS ── */}
          <div className="results-card">
            <div className="card-header">
              <div className="tab-group">
                <button className={`tab-btn ${activeTab==="findings"?"active":""}`} onClick={()=>setActiveTab("findings")}>
                  <AlertCircle size={13}/> Findings {issues.length>0&&<span className="cnt-badge">{issues.length}</span>}
                </button>
                <button className={`tab-btn ${activeTab==="metrics"?"active":""}`} onClick={()=>setActiveTab("metrics")}>
                  <TrendingUp size={13}/> Metrics
                </button>
              </div>
              {results?.detected_language&&<span className="lang-tag"><Globe size={11}/> {results.detected_language}</span>}
            </div>

            {/* Findings */}
            {activeTab==="findings" && (
              <>
                {issues.length>0 && (
                  <div className="filter-row">
                    <select className="filter-select" value={filterSev}  onChange={e=>setFilterSev(e.target.value)}>
                      <option value="ALL">All Severities</option>
                      {SEVERITIES.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="filter-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                      <option value="ALL">All Types</option>
                      {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="filter-count">{filtered.length}/{issues.length}</span>
                  </div>
                )}
                <div className="results-scroll">
                  {!results ? (
                    <div className="empty-state">
                      <BarChart2 size={44} className="empty-icon"/>
                      <p>Submit code for a deep AI + ML review.</p>
                    </div>
                  ) : filtered.length===0 ? (
                    <div className="empty-state success">
                      <CheckCircle2 size={44} color="#22c55e"/>
                      <p>{issues.length===0?"No issues — great code!":"No issues match filter."}</p>
                    </div>
                  ) : filtered.map((issue,idx)=>(
                    <div key={idx} className={`issue-card sev-${issue.severity?.toLowerCase()}`}>
                      <div className="issue-meta">
                        <span className="sev-pill" style={{color:SEV_COLOR[issue.severity?.toUpperCase()],borderColor:SEV_COLOR[issue.severity?.toUpperCase()]}}>
                          {issue.severity}
                        </span>
                        <span className="type-pill" style={{color:TYPE_COLOR[issue.issue_type?.toUpperCase()]}}>
                          {issue.issue_type}
                        </span>
                        {issue.line_number&&<span className="line-pill">L{issue.line_number}</span>}
                      </div>
                      <p className="issue-msg">{issue.message}</p>
                      {issue.impact&&<div className="impact-row">⚠ <em>{issue.impact}</em></div>}
                      {issue.suggestion&&(
                        <div className="fix-box">
                          <span className="fix-label">Fix</span> {issue.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Metrics */}
            {activeTab==="metrics" && (
              <div className="metrics-scroll">
                {!results ? (
                  <div className="empty-state"><TrendingUp size={44} className="empty-icon"/><p>Run analysis to see metrics.</p></div>
                ) : (
                  <>
                    {qualScore!=null&&(
                      <div className="metric-row highlight-row">
                        <span>Quality Score</span>
                        <span style={{color:qualColor(qualScore),fontWeight:700}}>{qualScore}/100</span>
                      </div>
                    )}
                    {Object.entries(results.metrics||{}).map(([k,v])=>(
                      <div className="metric-row" key={k}>
                        <span>{k.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}</span>
                        <span className={`metric-val ${v===true?"good":v===false?"bad":""}`}>
                          {typeof v==="boolean"?(v?"✓ Yes":"✗ No"):String(v)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

        </div>{/* /content-grid */}
      </div>{/* /main-wrapper */}

      {/* ── CHATBOT ── */}
      <div className="chatbot-wrap">
        {!showChat ? (
          <button className="chat-fab" onClick={()=>setShowChat(true)}>
            <MessageSquare size={22}/>
            {issues.length>0&&<span className="chat-notif">{issues.length}</span>}
          </button>
        ) : (
          <div className="chat-panel">
            <div className="chat-head">
              <div className="chat-head-info">
                <div className="chat-avatar"><Brain size={16}/></div>
                <div>
                  <div className="chat-name">AI Security Expert</div>
                  <div className="chat-status">● Online</div>
                </div>
              </div>
              <button className="chat-close-btn" onClick={()=>setShowChat(false)}><X size={16}/></button>
            </div>
            <div className="chat-messages">
              {chatMsgs.map((m,i)=>(
                <div key={i} className={`chat-msg ${m.role}`}>
                  {m.role==="bot"&&<div className="msg-avatar"><Brain size={12}/></div>}
                  <div className="msg-bubble">{m.text}</div>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>
            <form className="chat-form" onSubmit={handleChat}>
              <input className="chat-input" value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Ask about findings…"/>
              <button className="chat-send" type="submit"><Send size={15}/></button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
}
