const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const PORT = process.env.PORT || 5000;
const ROOT_DIR = path.resolve(__dirname, "..");

// Single central SQLite database
const dbPath = path.join(__dirname, "database.db");
const db = new DatabaseSync(dbPath);

console.log(`✅ Single SQLite database connected at: ${dbPath}`);

// Initialize unified database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    date TEXT,
    duration TEXT,
    words_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    transcript TEXT,
    summary TEXT,
    tasks TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add missing columns if upgrading old schema
const alterColumns = [
  "ALTER TABLE meetings ADD COLUMN username TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE meetings ADD COLUMN date TEXT",
  "ALTER TABLE meetings ADD COLUMN duration TEXT",
  "ALTER TABLE meetings ADD COLUMN words_count INTEGER DEFAULT 0",
  "ALTER TABLE meetings ADD COLUMN language TEXT DEFAULT 'en'",
  "ALTER TABLE meetings ADD COLUMN tasks TEXT",
  "ALTER TABLE meetings ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP"
];

alterColumns.forEach((sql) => {
  try {
    db.exec(sql);
  } catch (e) {
    // Ignore if column already exists
  }
});

function formatMeeting(row) {
  if (!row) return null;
  let parsedTasks = [];
  try {
    parsedTasks = row.tasks ? JSON.parse(row.tasks) : [];
  } catch (e) {
    parsedTasks = [];
  }
  return {
    ...row,
    tasks: Array.isArray(parsedTasks) ? parsedTasks : []
  };
}

// Helpers for HTTP server
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Username");
}

function sendJson(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jsx": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};

function serveStaticFile(reqPath, res) {
  let relativePath = reqPath.split("?")[0];
  if (relativePath === "/") relativePath = "/index.html";

  let filePath = path.join(ROOT_DIR, relativePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT_DIR, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    } else {
      setCorsHeaders(res);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const method = req.method;
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname;

  setCorsHeaders(res);

  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (pathname === "/api/health" || pathname === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      database: "Single SQLite Database Connected",
      timestamp: new Date().toISOString()
    });
  }

  // REGISTER
  if ((pathname === "/register" || pathname === "/api/register") && method === "POST") {
    const body = await parseJsonBody(req);
    const { username, password, phone_number } = body;

    if (!username || !password || !phone_number) {
      return sendJson(res, 400, { success: false, error: "Username, password and phone number are required" });
    }

    try {
      const checkStmt = db.prepare("SELECT id FROM users WHERE phone_number = ?");
      const existing = checkStmt.get(phone_number);
      if (existing) {
        return sendJson(res, 409, { success: false, error: "Phone number already exists" });
      }

      const insertStmt = db.prepare("INSERT INTO users (username, password, phone_number) VALUES (?, ?, ?)");
      insertStmt.run(username, password, phone_number);
      return sendJson(res, 201, { success: true, message: "User registered successfully" });
    } catch (err) {
      if (err.message.includes("UNIQUE") || err.message.includes("sqlite")) {
        return sendJson(res, 409, { success: false, error: "Phone number already exists" });
      }
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // LOGIN
  if ((pathname === "/login" || pathname === "/api/login") && method === "POST") {
    const body = await parseJsonBody(req);
    const { username, password } = body;

    if (!username || !password) {
      return sendJson(res, 400, { success: false, error: "Username and password are required" });
    }

    try {
      const stmt = db.prepare("SELECT id, username, phone_number FROM users WHERE username = ? AND password = ?");
      const user = stmt.get(username, password);
      if (!user) {
        return sendJson(res, 401, { success: false, error: "Invalid username or password" });
      }
      return sendJson(res, 200, { success: true, user });
    } catch (err) {
      return sendJson(res, 500, { success: false, error: err.message });
    }
  }

  // MEETING ROUTES
  if (pathname.startsWith("/meetings") || pathname.startsWith("/api/meetings")) {
    const usernameHeader = req.headers["x-user-username"];
    if (!usernameHeader) {
      return sendJson(res, 401, { success: false, error: "Unauthorized: Username header missing" });
    }

    const cleanPath = pathname.replace(/^\/api/, ""); // /api/meetings -> /meetings
    const parts = cleanPath.split("/").filter(Boolean); // ['meetings'] or ['meetings', '123']

    // GET /meetings
    if (parts.length === 1 && method === "GET") {
      try {
        const stmt = db.prepare("SELECT * FROM meetings WHERE username = ? ORDER BY id DESC");
        const rows = stmt.all(usernameHeader);
        const meetings = rows.map(formatMeeting);
        return sendJson(res, 200, { success: true, meetings, data: meetings });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // GET /meetings/:id
    if (parts.length === 2 && method === "GET") {
      const id = parts[1];
      try {
        const stmt = db.prepare("SELECT * FROM meetings WHERE id = ? AND username = ?");
        const row = stmt.get(id, usernameHeader);
        if (!row) {
          return sendJson(res, 404, { success: false, error: "Meeting not found" });
        }
        return sendJson(res, 200, { success: true, meeting: formatMeeting(row) });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // POST /meetings
    if (parts.length === 1 && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        title = "Untitled Meeting",
        date = new Date().toLocaleDateString(),
        duration = "0 sec",
        words_count = 0,
        language = "en",
        transcript = "",
        summary = "",
        tasks = []
      } = body;

      const tasksJson = JSON.stringify(Array.isArray(tasks) ? tasks : []);

      try {
        const insertStmt = db.prepare(`
          INSERT INTO meetings (username, title, date, duration, words_count, language, transcript, summary, tasks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = insertStmt.run(usernameHeader, title, date, duration, words_count, language, transcript, summary, tasksJson);
        const newId = Number(info.lastInsertRowid);

        const getStmt = db.prepare("SELECT * FROM meetings WHERE id = ?");
        const row = getStmt.get(newId);

        return sendJson(res, 201, {
          success: true,
          message: "Meeting added successfully",
          id: newId,
          meeting: formatMeeting(row) || { id: newId, username: usernameHeader, title, date, duration, words_count, language, transcript, summary, tasks }
        });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // PUT /meetings/:id
    if (parts.length === 2 && method === "PUT") {
      const id = parts[1];
      const body = await parseJsonBody(req);
      const { title, transcript, summary, tasks, duration, words_count, language, date } = body;

      try {
        const getStmt = db.prepare("SELECT * FROM meetings WHERE id = ? AND username = ?");
        const existing = getStmt.get(id, usernameHeader);
        if (!existing) {
          return sendJson(res, 404, { success: false, error: "Meeting not found" });
        }

        const updatedTitle = title !== undefined ? title : existing.title;
        const updatedTranscript = transcript !== undefined ? transcript : existing.transcript;
        const updatedSummary = summary !== undefined ? summary : existing.summary;
        const updatedTasks = tasks !== undefined ? JSON.stringify(tasks) : existing.tasks;
        const updatedDuration = duration !== undefined ? duration : existing.duration;
        const updatedWordsCount = words_count !== undefined ? words_count : existing.words_count;
        const updatedLanguage = language !== undefined ? language : existing.language;
        const updatedDate = date !== undefined ? date : existing.date;

        const updateStmt = db.prepare(`
          UPDATE meetings
          SET title = ?, transcript = ?, summary = ?, tasks = ?, duration = ?, words_count = ?, language = ?, date = ?
          WHERE id = ? AND username = ?
        `);
        updateStmt.run(updatedTitle, updatedTranscript, updatedSummary, updatedTasks, updatedDuration, updatedWordsCount, updatedLanguage, updatedDate, id, usernameHeader);

        const row = getStmt.get(id, usernameHeader);
        return sendJson(res, 200, { success: true, message: "Meeting updated", meeting: formatMeeting(row) });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // DELETE /meetings/:id
    if (parts.length === 2 && method === "DELETE") {
      const id = parts[1];
      try {
        const delStmt = db.prepare("DELETE FROM meetings WHERE id = ? AND username = ?");
        const info = delStmt.run(id, usernameHeader);
        if (info.changes === 0) {
          return sendJson(res, 404, { success: false, error: "Meeting not found" });
        }
        return sendJson(res, 200, { success: true, message: "Meeting deleted successfully" });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // DELETE /meetings (Clear All for User)
    if (parts.length === 1 && method === "DELETE") {
      try {
        const delStmt = db.prepare("DELETE FROM meetings WHERE username = ?");
        delStmt.run(usernameHeader);
        return sendJson(res, 200, { success: true, message: "All meetings cleared successfully" });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }
  }

  // Serve static files for frontend
  serveStaticFile(pathname, res);
});

server.listen(PORT, () => {
  console.log(`🚀 KAIC AI Server (Single Database) running on http://localhost:${PORT}`);
  console.log(`📊 Single SQLite database connected at: ${dbPath}`);
});