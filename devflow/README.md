# 🔍 devflow

**Drop-in API call recorder + AI system design visualizer for Node.js**

Record every HTTP/HTTPS call your app makes, visualize it live in a beautiful dashboard,  
and use Claude AI to auto-generate system architecture diagrams and explanations.

---

## Quick Start

### 1. Install (one time only)

```bash
cd devflow
npm install
```

### 2. Run your app with devflow

**Option A — preload flag (no code changes needed):**
```bash
node -r ./devflow/index.js your-app.js
```

**Option B — add one line to your entry file:**
```js
require('./devflow');   // ← add this as the very first line
// ... rest of your app
```

### 3. Open the dashboard

```
http://localhost:4444
```

> Change the port: `DEVFLOW_PORT=3333 node -r ./devflow/index.js your-app.js`

---

## Features

| Feature | Details |
|---|---|
| 🔴 Live call feed | Every HTTP/HTTPS request appears instantly |
| 🔍 Request inspector | Full URL, headers, body, status, duration |
| 📊 Timeline view | Visual bar chart of call timing |
| ✦ AI Analysis | Claude generates Mermaid system diagram + explanation |
| 🧹 Clear & replay | Reset and re-record anytime |

---

## How AI Analysis Works

1. Record traffic from your running app
2. Click **✦ AI Analyze** in the dashboard
3. Claude analyzes all captured calls and produces:
   - A **Mermaid sequence/architecture diagram**
   - A **written explanation** of your system
   - **Key observations** (bottlenecks, patterns, anomalies)
   - A **services breakdown** (what each host does)

---

## What gets intercepted

devflow patches Node.js's `http.request` and `https.request` at the lowest level,  
so it captures calls from: `fetch`, `axios`, `node-fetch`, `got`, `superagent`, `request`, etc.

devflow does **not** capture:
- Calls to `api.anthropic.com` (its own AI analysis calls)
- Calls to its own dashboard server (`localhost:4444`)

---

## Project structure

```
devflow/
  index.js      ← interceptor + WebSocket server + embedded dashboard
  package.json  ← only dependency: ws
  README.md
```

Everything is in a single `index.js` — no build step, no config required.

---

## Example: Express app

```js
require('./devflow');              // ← add this first

const express = require('express');
const axios   = require('axios');
const app     = express();

app.get('/', async (req, res) => {
  const data = await axios.get('https://api.github.com/users/octocat');
  res.json(data.data);
});

app.listen(3000, () => console.log('App on :3000'));
```

Run: `node app.js`  
Dashboard: `http://localhost:4444`
