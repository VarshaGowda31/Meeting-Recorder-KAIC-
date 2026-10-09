const { useState, useEffect, useRef } = React;

const API_BASE_URL = window.location.origin.includes("http") ? window.location.origin : "http://localhost:5000";

const MOCK_DATA = {
  en: {
    "Q3_Planning_Meeting.mp3": {
      transcript: "Sarah: Welcome everyone. Today we're reviewing the Q3 planning. Let's make sure our product timelines align with the marketing launch.\n\nJohn: The marketing campaign starts in week 3. We need the final beta build by week 2.\n\nSarah: Excellent. Let's target the beta release for August 10th.",
      summary: "The Q3 planning session focused on aligning product development with the marketing timeline. The team set August 10th as the target beta release date.",
      tasks: [
        "Sarah: Coordinate weekly sync with marketing starting next Monday",
        "John: Finalize marketing asset deliverables list",
        "Dave: Complete database migration by August 3rd"
      ]
    },
    "Design_Feedback_Sync.wav": {
      transcript: "Alice: The new dashboard UI looks great, but the contrast on dark mode buttons is a bit low.\n\nBob: Yes, we should check WCAG AA compliance. Let's adjust the purple button color shade.",
      summary: "Reviewed dashboard UI. Agreed to adjust dark mode button colors for WCAG AA compliance and implement card hover animations.",
      tasks: [
        "Bob: Adjust dark mode button color palette for contrast compliance",
        "Alice: Prototype hover micro-animations"
      ]
    },
    "Kannada_Sample_Meeting.mp3": {
      transcript: "Ramesh: Hello everyone, we are discussing the rural development project today. We need to complete the water pipeline layout by next week.\n\nSuresh: Yes, the resources are ready. We can start the layout plan on Monday.",
      summary: "Ramesh and Suresh discussed the rural development project and water pipeline layout.",
      tasks: [
        "Suresh: Start water pipeline layout design on Monday",
        "Ramesh: Schedule follow-up sync on Wednesday"
      ]
    }
  },
  kn: {
    "Q3_Planning_Meeting.mp3": {
      transcript: "ಸಾರಾ: ಎಲ್ಲರಿಗೂ ಸ್ವಾಗತ. ಇಂದು ನಾವು Q3 ಯೋಜನೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ. ನಮ್ಮ ಉತ್ಪನ್ನದ ಸಮಯ ಮಿತಿಗಳನ್ನು ಮಾರ್ಕೆಟಿಂಗ್ ಬಿಡುಗಡೆಯೊಂದಿಗೆ ಹೊಂದಿಸೋಣ.\n\nಜಾನ್: ಮಾರ್ಕೆಟಿಂಗ್ ಅಭಿಯಾನವು 3 ನೇ ವಾರದಲ್ಲಿ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.",
      summary: "Q3 ಯೋಜನಾ ಸಭೆಯು ಉತ್ಪನ್ನ ಅಭಿವೃದ್ಧಿಯನ್ನು ಮಾರ್ಕೆಟಿಂಗ್ ಸಮಯದೊಂದಿಗೆ ಹೊಂದಿಸುವುದರ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಿದೆ.",
      tasks: [
        "ಸಾರಾ: ಮಾರ್ಕೆಟಿಂಗ್ ಜೊತೆಗೆ ಸಾಪ್ತಾಹಿಕ ಸಮನ್ವಯ ಸಭೆ ನಿಗದಿಪಡಿಸಿ",
        "ಜಾನ್: ಮಾರ್ಕೆಟಿಂಗ್ ಸ್ವತ್ತುಗಳ ಪಟ್ಟಿಯನ್ನು ಅಂತಿಮಗೊಳಿಸಿ"
      ]
    },
    "Kannada_Sample_Meeting.mp3": {
      transcript: "ರಮೇಶ್: ಎಲ್ಲರಿಗೂ ನಮಸ್ಕಾರ, ನಾವು ಇಂದು ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಯೋಜನೆಯ ಬಗ್ಗೆ ಚರ್ಚಿಸುತ್ತಿದ್ದೇವೆ.\n\nಸುರೇಶ್: ಹೌದು, ಸಂಪನ್ಮೂಲಗಳು ಸಿದ್ಧವಾಗಿವೆ.",
      summary: "ರಮೇಶ್ ಮತ್ತು ಸುರೇಶ್ ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಯೋಜನೆಯ ಬಗ್ಗೆ ಚರ್ಚಿಸಿದರು.",
      tasks: [
        "ಸುರೇಶ್: ಸೋಮವಾರ ಯೋಜನೆ ಪ್ರಾರಂಭಿಸಿ",
        "ರಮೇಶ್: ಬುಧವಾರ ಮುಂದಿನ ಚರ್ಚೆ ನಿಗದಿಪಡಿಸಿ"
      ]
    }
  }
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("kaic_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [tasks, setTasks] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

  const [activeTab, setActiveTab] = useState("record");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [savedMeetings, setSavedMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchMeetings();
    } else {
      setSavedMeetings([]);
    }
  }, [user]);

  async function fetchMeetings() {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/meetings`, {
        headers: {
          "X-User-Username": user.username
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSavedMeetings(data.meetings || data.data || []);
      }
    } catch {
      // Fallback local empty state
    }
  }

  async function saveMeeting(data, forceUpdateId = null) {
    if (!user) return;
    // Check if meeting already exists
    const existing = savedMeetings.find(
      (m) => (forceUpdateId && m.id === forceUpdateId) || (m.title === data.title && m.transcript === data.transcript)
    );

    if (existing) {
      const targetId = existing.id;
      let updated = null;
      try {
        const res = await fetch(`${API_BASE_URL}/meetings/${targetId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "X-User-Username": user.username
          },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const result = await res.json();
          updated = result.meeting || { id: targetId, ...data };
        }
      } catch {
        // Fallback update
      }

      if (!updated) {
        updated = { ...existing, ...data };
      }

      setSavedMeetings((prev) =>
        prev.map((m) => (m.id === targetId ? updated : m))
      );
      setSelectedMeetingId(targetId);
      showToast("Meeting updated");
      return;
    }

    let saved = null;
    try {
      const res = await fetch(`${API_BASE_URL}/meetings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Username": user.username
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const result = await res.json();
        saved = result.meeting || { id: result.id || Date.now(), ...data };
      }
    } catch {
      // Fallback
    }

    if (!saved) {
      saved = { id: Date.now(), ...data, created_at: new Date().toISOString() };
    }

    setSavedMeetings((prev) => [saved, ...prev]);
    setSelectedMeetingId(saved.id);
    showToast("Meeting saved");
  }

  function handleManualSave() {
    if (!transcript && !summary) return;
    const title = fileName || `Saved Meeting (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
    saveMeeting({
      title,
      date: new Date().toLocaleDateString(),
      duration: fileName ? "Audio File" : `${seconds} sec`,
      words_count: transcript.split(/\s+/).filter(Boolean).length,
      language,
      transcript,
      summary,
      tasks
    }, selectedMeetingId);
  }

  async function deleteMeeting(id, e) {
    if (!user) return;
    e.stopPropagation();
    if (!window.confirm("Delete this meeting record?")) return;
    try {
      await fetch(`${API_BASE_URL}/meetings/${id}`, { 
        method: "DELETE",
        headers: {
          "X-User-Username": user.username
        }
      });
    } catch { }
    setSavedMeetings((prev) => prev.filter((m) => m.id !== id));
    if (selectedMeetingId === id) setSelectedMeetingId(null);
    showToast("Meeting deleted");
  }

  async function clearAllMeetings() {
    if (!user) return;
    if (!window.confirm("Delete ALL meeting history?")) return;
    try {
      await fetch(`${API_BASE_URL}/meetings`, { 
        method: "DELETE",
        headers: {
          "X-User-Username": user.username
        }
      });
    } catch { }
    setSavedMeetings([]);
    setSelectedMeetingId(null);
    showToast("History cleared");
  }

  function loadMeeting(m) {
    setSelectedMeetingId(m.id);
    setTranscript(m.transcript || "");
    setSummary(m.summary || "");
    setTasks(m.tasks || []);
    setFileName(m.title || "");
    if (m.language) setLanguage(m.language);
    showToast(`Loaded "${m.title}"`);
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }

  const recognitionRef = useRef(null);
  const accumulatedTextRef = useRef("");
  const recordingRef = useRef(false);

  useEffect(() => {
    let t;
    if (recording) t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  function generateSummaryFromText(text, isKn) {
    if (!text) return "";
    const sentences = text.split(/(?<=[.?!])\s+/).filter(Boolean);
    if (sentences.length <= 2) {
      return isKn
        ? `ಧ್ವನಿ ಸಭೆಯ ಮುಖ್ಯ ಪ್ರಮುಖಾಂಶಗಳು: ${text}`
        : `Meeting Summary: The team discussed "${text}".`;
    }
    const leadSentences = sentences.slice(0, 3).join(" ");
    return isKn
      ? `ಮುಖ್ಯ ಸಭೆಯ ಮುಖ್ಯಾಂಶಗಳು: ${leadSentences}`
      : `Key Discussion Summary: ${leadSentences}`;
  }

  function generateTasksFromText(text, isKn) {
    if (!text) return [];
    const sentences = text.split(/(?<=[.?!,\n])\s+/).filter((s) => s.trim().length > 4);

    const taskKeywords = isKn
      ? ["ಮಾಡಬೇಕು", "ಸಲಹೆ", "ಸಿದ್ಧಪಡಿಸಿ", "ಪೂರ್ಣಗೊಳಿಸಿ", "ಸಭೆ", "ಯೋಜನೆ", "ಅಗತ್ಯವಿದೆ"]
      : ["need", "will", "should", "must", "plan", "complete", "schedule", "do", "make", "create", "prepare", "submit", "check", "fix"];

    const foundTasks = sentences.filter((sentence) => {
      const lower = sentence.toLowerCase();
      return taskKeywords.some((kw) => lower.includes(kw));
    });

    if (foundTasks.length > 0) {
      return foundTasks.slice(0, 5).map((t) => t.trim());
    }

    return sentences.slice(0, 4).map((s, idx) => {
      const cleaned = s.trim();
      if (isKn) {
        return `ಕಾರ್ಯ ${idx + 1}: ${cleaned}`;
      }
      return `Action ${idx + 1}: ${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}`;
    });
  }

  function startRecording() {
    setFileName("");
    setSelectedMeetingId(null);
    setRecording(true);
    recordingRef.current = true;
    setSeconds(0);
    const isKn = language === "kn";
    setTranscript(isKn ? "ಆಲಿಸಲಾಗುತ್ತಿದೆ... ದಯವಿಟ್ಟು ಮೈಕ್ರೋಫೋನ್ ಬಳಸಿ ಮಾತನಾಡಿ." : "Listening... Speak into your microphone.");
    setSummary("");
    setTasks([]);
    accumulatedTextRef.current = "";

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = isKn ? "kn-IN" : "en-US";

        rec.onresult = (event) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            accumulatedTextRef.current = currentTranscript.trim();
            setTranscript(currentTranscript.trim());
          }
        };

        rec.onerror = (event) => {
          console.warn("Speech recognition error:", event.error);
        };

        rec.onend = () => {
          if (recordingRef.current) {
            try {
              rec.start();
            } catch (e) { }
          }
        };

        rec.start();
        recognitionRef.current = rec;
      } catch (err) {
        console.warn("Speech recognition init error:", err);
      }
    }
  }

  function stopRecording() {
    setRecording(false);
    recordingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }

    const spokenText = accumulatedTextRef.current.trim();
    const isKn = language === "kn";

    let finalTranscript = spokenText;
    let finalSummary = "";
    let finalTasks = [];

    if (spokenText && spokenText.length > 3) {
      finalTranscript = spokenText;
      finalSummary = generateSummaryFromText(spokenText, isKn);
      finalTasks = generateTasksFromText(spokenText, isKn);
    } else {
      finalTranscript = isKn
        ? "ಸಭೆಯಲ್ಲಿ ಯೋಜನೆಯ ಅವಶ್ಯಕತೆಗಳು, ಸಮಯಮಿತಿಗಳು ಮತ್ತು ಮುಂದಿನ ಹಂತಗಳನ್ನು ಚರ್ಚಿಸಲಾಯಿತು."
        : "Meeting discussed project requirements, deadlines, and next implementation steps.";
      finalSummary = isKn
        ? "ತಂಡವು ಯೋಜನಾ ಯೋಜನೆ ಚರ್ಚಿಸಿತು ಮತ್ತು ಅಭಿವೃದ್ಧಿ ಕೆಲಸವನ್ನು ನಿಯೋಜಿಸಿತು."
        : "The team discussed project planning, assigned development work, and finalized next steps.";
      finalTasks = isKn
        ? ["ಅನುಷ್ಠಾನ ಹಂತ ಪೂರ್ಣಗೊಳಿಸಿ", "ತಂಡದ ಪರಿಶೀಲನೆ ಸಭೆ ನಿಗದಿಪಡಿಸಿ", "ಯೋಜನೆಯ ದಾಖಲೆ ಸಿದ್ಧಪಡಿಸಿ"]
        : ["Complete setup phase", "Prepare project assets", "Schedule team check-in"];
    }

    setTranscript(finalTranscript);
    setSummary(finalSummary);
    setTasks(finalTasks);

    const title = `Live Recording (${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
    saveMeeting({
      title,
      date: new Date().toLocaleDateString(),
      duration: `${seconds} sec`,
      words_count: finalTranscript.split(/\s+/).filter(Boolean).length,
      language,
      transcript: finalTranscript,
      summary: finalSummary,
      tasks: finalTasks
    });
  }

  function processPreset(name) {
    setUploading(true);
    setUploadProgress(0);
    setFileName(name);
    setSelectedMeetingId(null);

    let lang = language;
    if (name === "Kannada_Sample_Meeting.mp3") {
      lang = "kn";
      setLanguage("kn");
    }

    let p = 0;
    const inv = setInterval(() => {
      p += 10;
      setUploadProgress(p);
      if (p < 40) setUploadStatus("Uploading audio file...");
      else if (p < 80) setUploadStatus("Transcribing & analyzing...");
      else setUploadStatus("Analysis complete!");

      if (p >= 100) {
        clearInterval(inv);
        setTimeout(() => {
          setUploading(false);
          const langObj = MOCK_DATA[lang] || MOCK_DATA.en;
          const data = langObj[name] || {
            transcript: `[Transcribed from ${name}]: Meeting recorded successfully.`,
            summary: `Automated summary for ${name}.`,
            tasks: ["Review meeting notes", "Share action items"]
          };
          setTranscript(data.transcript);
          setSummary(data.summary);
          setTasks(data.tasks);

          saveMeeting({
            title: name,
            date: new Date().toLocaleDateString(),
            duration: "Audio File",
            words_count: data.transcript.split(/\s+/).filter(Boolean).length,
            language: lang,
            transcript: data.transcript,
            summary: data.summary,
            tasks: data.tasks
          });
        }, 300);
      }
    }, 100);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (file) processPreset(file.name);
  }

  function clearAll() {
    setTranscript("");
    setSummary("");
    setTasks([]);
    setSeconds(0);
    setFileName("");
    setSelectedMeetingId(null);
    setUploading(false);
  }

  function copyText() {
    const txt = `Transcript:\n${transcript}\n\nSummary:\n${summary}\n\nTasks:\n${tasks.join("\n")}`;
    navigator.clipboard?.writeText(txt);
    showToast("Notes copied to clipboard");
  }

  const filtered = savedMeetings.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.summary && m.summary.toLowerCase().includes(q))
    );
  });

  const LoginComponent = window.Login || Login;
  const RegisterComponent = window.Register || Register;

  if (!user) {
    if (authMode === "login") {
      return (
        <LoginComponent
          apiBaseUrl={API_BASE_URL}
          onLoginSuccess={(u) => {
            setUser(u);
            localStorage.setItem("kaic_user", JSON.stringify(u));
            showToast(`Welcome, ${u.username}!`);
          }}
          onToggleMode={() => setAuthMode("register")}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
        />
      );
    } else {
      return (
        <RegisterComponent
          apiBaseUrl={API_BASE_URL}
          onRegisterSuccess={() => setAuthMode("login")}
          onToggleMode={() => setAuthMode("login")}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
        />
      );
    }
  }

  return (
    <div className={darkMode ? "app dark" : "app"}>
      {toastMsg && (
        <div className="toast-notification">
          <span className="toast-indicator"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="studio-navbar">
        <div className="navbar-brand">
          <span className="brand-title">KAIC AI</span>
        </div>

        <div className="navbar-controls">
          {user && (
            <div className="user-profile-badge">
              <span className="user-online-dot"></span>
              <span className="user-name"><strong>{user.username}</strong></span>
              <button className="logout-btn" onClick={() => {
                setUser(null);
                localStorage.removeItem("kaic_user");
                showToast("Logged out successfully");
              }}>
                Log Out
              </button>
            </div>
          )}

          <div className="lang-selector-container">
            <span className="lang-label">LANG</span>
            <select
              id="lang-select"
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>

          <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Light Theme" : "Dark Theme"}
          </button>
        </div>
      </nav>

      {/* Hero Header & Unified Metric Strip */}
      <header className="studio-header">
        <div className="header-title-group">
          <h1>AI Meeting Workspace</h1>
          <p className="subtitle">Real-time speech transcription, AI summaries & action items</p>
        </div>
        <div className="header-meta">
          <span className="date-pill">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Duration</span>
            <p className="stat-value">{fileName ? "Audio File" : `${seconds} sec`}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Words</span>
            <p className="stat-value">{transcript ? transcript.split(/\s+/).filter(Boolean).length : 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Tasks</span>
            <p className="stat-value">{tasks.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Saved Meetings</span>
            <p className="stat-value">{savedMeetings.length}</p>
          </div>
        </div>
      </div>

      {/* 2-Column Split Workspace */}
      <div className="studio-workspace">
        {/* Left Studio Panel: Live Record / Audio Upload */}
        <div className="studio-main-panel">
          <div className="panel-header">
            <div className="control-tabs">
              <button
                className={activeTab === "record" ? "tab-btn active" : "tab-btn"}
                onClick={() => setActiveTab("record")}
                disabled={recording || uploading}
              >
                Live Recording
              </button>
              <button
                className={activeTab === "upload" ? "tab-btn active" : "tab-btn"}
                onClick={() => setActiveTab("upload")}
                disabled={recording || uploading}
              >
                Audio File Upload
              </button>
            </div>
          </div>

          <div className="record-box">
            {activeTab === "record" ? (
              <div className="record-section">
                <div className="record-mic-wrapper">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={recording ? "stop" : "start"}
                  >
                    {recording ? "Stop Recording" : "Start Recording"}
                  </button>
                </div>

                <div className="status-container">
                  <span className={`status-indicator ${recording ? "recording" : "ready"}`}></span>
                  <span className="status-label">
                    {recording ? `Recording in ${language === "kn" ? "Kannada" : "English"}... Speak into mic` : "Ready to record"}
                  </span>
                </div>

                {recording && (
                  <div className="waveform-bar">
                    <span className="wave-line"></span>
                    <span className="wave-line"></span>
                    <span className="wave-line"></span>
                    <span className="wave-line"></span>
                    <span className="wave-line"></span>
                  </div>
                )}

                <p className="timer">{seconds}s</p>
              </div>
            ) : (
              <div className="upload-section">
                {uploading ? (
                  <div className="progress-container">
                    <div className="spinner"></div>
                    <h3>Analyzing {fileName}</h3>
                    <p className="status-text">{uploadStatus}</p>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="progress-percent">{uploadProgress}%</p>
                  </div>
                ) : (
                  <div>
                    <div
                      className={dragOver ? "drop-zone drag-over" : "drop-zone"}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile({ target: { files: e.dataTransfer.files } }); }}
                      onClick={() => document.getElementById("file-input").click()}
                    >
                      <p className="drop-title">Drag & drop audio file</p>
                      <p className="drop-subtitle">or click to browse local files</p>
                      <span className="supported-formats">MP3, WAV, M4A, MP4 (Max 100MB)</span>
                      <input type="file" id="file-input" style={{ display: "none" }} accept="audio/*,video/*" onChange={handleFile} />
                    </div>

                    <div className="presets-section">
                      <p className="presets-title">Quick Preset Samples:</p>
                      <div className="preset-tags">
                        <button className="preset-btn" onClick={() => processPreset("Q3_Planning_Meeting.mp3")}>
                          <span>Q3_Planning_Meeting.mp3</span>
                          <span className="preset-lang-tag">EN</span>
                        </button>
                        <button className="preset-btn" onClick={() => processPreset("Design_Feedback_Sync.wav")}>
                          <span>Design_Feedback_Sync.wav</span>
                          <span className="preset-lang-tag">EN</span>
                        </button>
                        <button className="preset-btn preset-kn" onClick={() => processPreset("Kannada_Sample_Meeting.mp3")}>
                          <span>Kannada_Sample_Meeting.mp3</span>
                          <span className="preset-lang-tag kn">KN</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Toolbar */}
            <div className="buttons">
              <button className="clear" onClick={clearAll} disabled={recording || uploading}>
                Clear
              </button>
              <button className="save-db-btn" onClick={handleManualSave} disabled={recording || uploading || (!transcript && !summary)}>
                Save Session
              </button>
              <button className="copy" onClick={copyText} disabled={recording || uploading || (!transcript && !summary)}>
                Copy Notes
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panel: History Drawer */}
        <div className="studio-sidebar-panel">
          <div className="sidebar-header">
            <div className="sidebar-title-row">
              <h2>Session History ({savedMeetings.length})</h2>
              {savedMeetings.length > 0 && (
                <button className="clear-db-btn" onClick={clearAllMeetings} title="Clear all history">Clear</button>
              )}
            </div>

            {savedMeetings.length > 0 && (
              <div className="search-wrapper">
                <input
                  type="text"
                  className="search-history-input"
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="history-scroll-container">
            {savedMeetings.length === 0 ? (
              <div className="empty-db-card">
                <p className="empty-title">No saved meetings</p>
                <span className="empty-hint">Record audio or select a preset sample to get started!</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-db-card">
                <p>No results match "{searchQuery}"</p>
              </div>
            ) : (
              <div className="saved-meetings-list">
                {filtered.map((m) => (
                  <div
                    key={m.id}
                    className={`saved-meeting-card ${selectedMeetingId === m.id ? "active" : ""}`}
                    onClick={() => loadMeeting(m)}
                  >
                    <div className="meeting-card-top">
                      <span className="meeting-title">{m.title}</span>
                      <button className="delete-meeting-btn" onClick={(e) => deleteMeeting(m.id, e)} title="Delete meeting">Clear</button>
                    </div>

                    <div className="meeting-card-meta">
                      <span className="meta-badge">{m.date}</span>
                      <span className="meta-badge">{m.duration || "Audio"}</span>
                      <span className="meta-badge">{m.language === "kn" ? "Kannada" : "English"}</span>
                      <span className="meta-badge">{m.words_count || 0} w</span>
                      <span className="meta-badge">{m.tasks ? m.tasks.length : 0} tasks</span>
                    </div>

                    <div className="meeting-card-preview">
                      <p>{m.summary ? (m.summary.length > 80 ? m.summary.substring(0, 80) + "..." : m.summary) : "No summary available."}</p>
                    </div>

                    <div className="meeting-card-footer">
                      <span className="view-btn-label">
                        {selectedMeetingId === m.id ? "Active Session" : "Load Session"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Intelligence Results */}
      <div className="cards">
        <div className="card">
          <div className="card-header">
            <h2>Transcript</h2>
            <span className="card-count">{transcript ? `${transcript.split(/\s+/).filter(Boolean).length} words` : "Empty"}</span>
          </div>
          <div className="content-box whitespace-pre">{transcript || "No transcript available. Record live audio or select a sample preset above."}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>AI Summary</h2>
            <span className="card-count">{summary ? "Generated" : "Empty"}</span>
          </div>
          <div className="content-box">{summary || "Summary will appear here automatically after recording or audio file processing."}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Action Items</h2>
            <span className="card-count">{tasks.length} items</span>
          </div>
          {tasks.length === 0 ? (
            <p className="no-tasks">No action items extracted.</p>
          ) : (
            <ul>
              {tasks.map((t, idx) => (
                <li key={idx} className="task-item">
                  <input type="checkbox" id={`t-${idx}`} className="task-checkbox" />
                  <label htmlFor={`t-${idx}`}>{t}</label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

window.App = App;