# ⠿ Braillie — Braille Textbook Conversion & Print Queue Manager

A specialized web application built for school libraries preparing accessible textbooks and tactile Braille materials for visually impaired students.

Unlike simple status-tracking dashboards, **Braillie contains a real, test-verified English-to-Unicode Braille conversion engine** that extracts text from `.txt`, `.pdf`, and `.docx` documents, translates text into Grade 1 and Grade 2 (supported subset) Braille cells, supports human-in-the-loop proofreading, and manages an embossing print queue with paper inventory accounting.

---

## 🚀 Key Features

1. **Document Upload & Text Extraction**:
   - Accepts `.txt` (native Node.js `fs`), `.pdf` (`pdf-parse`), and `.docx` (`mammoth`).
   - Rejects scanned image-only files with clear errors; moves valid chapters to `TEXT_EXTRACTION`.
   - File bytes stored safely on the server disk in `/uploads`; MongoDB stores only metadata and `storageKey`.

2. **Accurate Unicode Braille Engine (`services/brailleConverter.js`)**:
   - Generates authentic 6-dot Unicode Braille glyphs (U+2800 to U+283F).
   - **Grade 1 Translation (Complete)**:
     - Full alphabet (`a-z` -> `⠁`-`⠵`).
     - Capital indicator (`⠠` / U+2820) for uppercase letters.
     - Number indicator (`⠼` / U+283C) preceding consecutive digit runs, reusing `a-j` dot patterns (`123` -> `⠼⠁⠃⠉`).
     - Complete punctuation marks (.,;:!?'"()-) and newline/space preservation.
   - **Grade 2 Translation (Verified Common Subset)**:
     - Whole-word contractions (wordsigns): `the` (`⠮`), `and` (`⠯`), `for` (`⠿`), `of` (`⠷`), `with` (`⠾`), `but` (`⠃`), `have` (`⠓`), `that` (`⠞`), `not` (`⠝`), `you` (`⠽`), `can` (`⠉`), `people` (`⠏`).
     - Letter-group contractions (groupsigns): `ch` (`⠡`), `sh` (`⠩`), `th` (`⠹`), `wh` (`⠱`), `er` (`⠻`), `ou` (`⠳`), `ow` (`⠪`), `ing` (`⠬`), `ed` (`⠫`), `ar` (`⠜`).
     - Explicitly documented: full Grade 2 Braille has hundreds of contextual rules and is intentionally scoped to this verified subset.

3. **Human-in-the-Loop Proofreading Studio**:
   - Two-column split workbench:
     - **Left**: Editable original/extracted source text with live word & character counts.
     - **Right**: Large-cell tactile Braille preview with Braille font scaling, clipboard copy, and sheet estimation.
   - "Re-translate" button to immediately recalculate Braille when source text is corrected.
   - Mandatory human approval: a chapter cannot enter the embossing queue without transcriber approval.

4. **Embossing / Print Queue**:
   - Digital job tracking with queue position, Braille cell count, and estimated sheets.
   - Blocks chapters from entering the queue until proofreading approval.
   - Librarian can mark jobs `COMPLETED`.

5. **Heavyweight Paper Inventory Ledger**:
   - Real-time stock tracking with configurable minimum reorder threshold.
   - Completing an embossing print job automatically deducts consumed sheets.
   - Automatic low-stock warning banners when inventory is low.
   - Full transaction ledger (`+ ADDED`, `- CONSUMED`).

6. **Conflict-Free Volunteer Assignments**:
   - Prevents assigning multiple active volunteers to the same chapter stage simultaneously.
   - Role-based views: Volunteers see only their assigned work; Admins manage all.

7. **End-to-End Stage Audit Trail**:
   - Complete history of every state change (`PENDING` ➔ `TEXT_EXTRACTION` ➔ `BRAILLE_TRANSLATION` ➔ `PROOFREADING` ➔ `EMBOSSING` ➔ `DONE`).
   - Logs who made the change, exact timestamp, and descriptive notes.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Desktop-first, accessible, clean UI (no bulky UI frameworks) |
| **Backend** | Node.js, Express.js | RESTful API, authentication, file handling |
| **Database** | MongoDB Atlas (Cloud) + Mongoose | Data models with relational references by `_id` |
| **Document Parsing** | `pdf-parse`, `mammoth`, `fs` | Extracting raw text from PDFs, DOCX, and TXT files |
| **File Storage** | Multer | Local disk storage (`/uploads`), metadata in MongoDB |
| **Security** | `bcryptjs`, `jsonwebtoken` (JWT) | Password hashing (salt rounds: 10) & RBAC session tokens |
| **Testing** | Jest | Exact Unicode codepoint assertion unit tests |

---

## 📂 Project Structure

```
Braillie/
├── package.json               # Root orchestrator scripts
├── .gitignore                 # node_modules, .env, uploads/* (!.gitkeep)
├── README.md                  # Complete documentation & viva notes
├── server/
│   ├── .env                   # Live environment variables (MONGODB_URI, JWT_SECRET, PORT)
│   ├── .env.example           # Template environment configuration
│   ├── package.json           # Server dependencies & scripts
│   ├── server.js              # Express entry point & route mounting
│   ├── config/
│   │   └── db.js              # Mongoose MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js            # User accounts (admin / volunteer)
│   │   ├── Textbook.js        # Textbook catalog
│   │   ├── Chapter.js         # Chapter data, status, sourceText, brailleText
│   │   ├── Document.js        # Uploaded document metadata
│   │   ├── Assignment.js      # Volunteer stage assignments
│   │   ├── PrintQueue.js      # Embossing queue entries
│   │   ├── Inventory.js       # Paper stock and transaction ledger
│   │   └── StageHistory.js    # Audit trail for all stage transitions
│   ├── middleware/
│   │   ├── auth.js            # requireAuth & requireRole (RBAC)
│   │   └── upload.js          # Multer storage with strict extension filters
│   ├── services/
│   │   ├── brailleConverter.js# Core Unicode Braille conversion engine
│   │   ├── textExtractor.js   # Extractor for .txt, .pdf, .docx
│   │   └── auditLogger.js     # Centralized stage transition logger
│   ├── controllers/           # Business logic for all 7 domain areas
│   ├── routes/                # Express API routes
│   ├── scripts/
│   │   └── seed.js            # Database seeder with sample textbooks and users
│   └── tests/
│       └── brailleConverter.test.js # Jest tests validating exact Unicode Braille
└── client/
    ├── package.json           # React & Vite dependencies
    ├── vite.config.js         # Proxy configuration for /api and /uploads
    ├── index.html             # HTML entry point with accessible typography
    └── src/
        ├── App.jsx            # Routing and role access control
        ├── main.jsx           # React DOM root
        ├── index.css          # Design system, accessible palette, Braille styling
        ├── api/
        │   └── client.js      # Axios client with JWT auto-attachment
        ├── context/
        │   └── AuthContext.jsx# Global authentication provider
        ├── components/
        │   ├── Navbar.jsx     # Role-based navigation header
        │   ├── StageBadge.jsx # Color-coded pipeline stage pill
        │   ├── StageHistoryModal.jsx # Timeline audit dialog
        │   └── Alert.jsx      # Notifications and low-stock banners
        └── pages/
            ├── Login.jsx      # Sign in with quick-demo buttons
            ├── Register.jsx   # Register as Admin or Volunteer
            ├── Dashboard.jsx  # Overview metrics & pipeline stats
            ├── Textbooks.jsx  # Textbook catalog & creation modal
            ├── TextbookDetail.jsx # Chapters list, upload dropzone, proofreader jump
            ├── Proofreading.jsx   # Two-column interactive workbench
            ├── Assignments.jsx    # Conflict-free chapter assignment manager
            ├── PrintQueue.jsx     # Embossing queue & completion modal
            └── Inventory.jsx      # Paper stock tracker & replenishment ledger
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18 or higher installed on your computer.
- **Git**: installed for version control.
- **MongoDB Atlas**: Free M0 cluster connection string.

### 2. Environment Variables Setup
The server reads configuration from `server/.env`.
A template is provided in `server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ofcar5k.mongodb.net/braillie_db?appName=Cluster0
JWT_SECRET=supersecret_braillie_jwt_key_2026_dev
```

*(Note: The active `server/.env` is already pre-configured with your Atlas database URI).*

### 3. Install Dependencies
Run the following commands:

```bash
# Install server packages
cd server
npm install

# Install client packages
cd ../client
npm install
```

---

## 🏃 Running the Application

### Option A: Run Server & Client in Separate Terminals (Recommended for Development)

**Terminal 1 (Backend API on port 5000):**
```bash
cd server
npm run dev
# Or: npm start
```

**Terminal 2 (Frontend React on port 3000):**
```bash
cd client
npm run dev
```

Visit the application in your browser at:
👉 **`http://localhost:3000`**

---

## 🧪 Running Automated Unit Tests

To run the Jest test suite verifying the exact Unicode Braille conversion:

```bash
cd server
npm test
```

### Test Coverage Highlights:
- **Individual alphabet**: `a` -> `⠁`, `b` -> `⠃`, `z` -> `⠵`
- **Uppercase indicator**: `A` -> `⠠⠁`, `Hello` -> `⠠⠓⠑⠇⠇⠕`
- **Numeric sequences**: Single digit `1` -> `⠼⠁`; multi-digits `42` -> `⠼⠙⠃`, `123` -> `⠼⠁⠃⠉`
- **Mixed numbers & words**: `Room 101` -> `⠠⠗⠕⠕⠍ ⠼⠁⠚⠁`
- **Standard punctuation & spacing**: periods, commas, question marks, exclamation points, colons, hyphens, parentheses, newlines
- **Grade 2 Wordsigns**: `the` (`⠮`), `and` (`⠯`), `for` (`⠿`), `of` (`⠷`), `with` (`⠾`), `but` (`⠃`), `have` (`⠓`), `that` (`⠞`), `not` (`⠝`), `you` (`⠽`), `can` (`⠉`), `people` (`⠏`)
- **Grade 2 Groupsigns**: `ch` (`⠡`), `sh` (`⠩`), `th` (`⠹`), `wh` (`⠱`), `er` (`⠻`), `ou` (`⠳`), `ow` (`⠪`), `ing` (`⠬`), `ed` (`⠫`), `ar` (`⠜`)
- **Full sentence conversion**: Compares character compression between Grade 1 and Grade 2.

---

## 👥 Demo Accounts (Viva Presentation Ready)

To populate the database with ready-to-test sample textbooks, chapters, documents, assignments, and audit logs:

```bash
cd server
npm run seed
```

Then sign in using one of the pre-configured accounts (or click the **Quick Fill Demo** buttons on the Login page):

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Librarian (Admin)** | `admin@braillie.lib` | `Admin@1234` | Full access: create textbooks, add chapters, assign volunteers, manage embossing queue, replenish paper inventory, view audit history. |
| **Transcriber (Volunteer)** | `volunteer@braillie.lib` | `Volunteer@1234` | Upload documents, run translation, edit in Proofreader Studio, approve for embossing, view assigned chapters. |

---

## 🎓 Viva Preparation & Architecture Guide

When presenting this project during a viva or practical exam, be prepared to answer:

1. **How does the Braille translation actually work?**
   - We map English characters to the **Unicode Braille Patterns block (U+2800 to U+283F)**.
   - In Braille, numbers share cells with the letters `a` through `j` (`1` = `a`, `2` = `b`, ..., `0` = `j`). To prevent collision between the number `1` and the letter `a`, a **number indicator (`⠼` / dots 3-4-5-6)** precedes any run of digits.
   - In Grade 2, we tokenize text and match common wordsigns (e.g. `the` -> `⠮`) and groupsigns (e.g. `ing` -> `⠬`) to reduce the physical bulk of the embossed textbook.

2. **Where are the uploaded files stored?**
   - Files are stored on the server's local filesystem in `/uploads` using **Multer**.
   - MongoDB only stores the document's metadata and relative path (`storageKey = 'uploads/<timestamp>-<filename>'`). Storing large raw binary blobs directly in MongoDB is bad practice because it clutters RAM and bloats indexes.

3. **Why is proofreading mandatory before embossing?**
   - Automated text extraction (especially from PDFs) can contain line breaks, hyphenated words, or OCR artifacts. Tactile embossing on heavyweight paper is permanent and expensive. The two-column workbench requires human review and confirmation before the chapter can enter the print queue.

4. **How are assignment conflicts handled?**
   - When an administrator assigns a chapter to a transcriber, the server validates whether there is already an active assignment for that chapter on that same pipeline stage. If so, it returns an HTTP 400 error, preventing duplicate work.
