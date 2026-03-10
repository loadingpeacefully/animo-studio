'use strict';

/**
 * devflow — drop this folder into any Node.js project.
 * Usage: node -r ./devflow/index.js your-app.js
 *   OR:  require('./devflow') at the top of your entry file
 */

const http  = require('http');
const https = require('https');
const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════
//  Config
// ═══════════════════════════════════════════════════
const PORT      = parseInt(process.env.DEVFLOW_PORT || '4444');
const MAX_CALLS = 1000;

// ═══════════════════════════════════════════════════
//  State
// ═══════════════════════════════════════════════════
const bus   = new EventEmitter();
const calls = [];
let   seq   = 0;

// ═══════════════════════════════════════════════════
//  Interceptor
// ═══════════════════════════════════════════════════
const SKIP = new Set(['api.anthropic.com']); // never capture devflow's own AI calls

function wrap(original, proto) {
  return function devflowRequest(opts, cb) {

    /* ---- parse opts ---- */
    let urlStr, method, host, pathname;
    if (typeof opts === 'string' || opts instanceof URL) {
      const u = new URL(opts.toString());
      urlStr   = u.href;
      method   = 'GET';
      host     = u.hostname;
      pathname = u.pathname + u.search;
    } else if (opts && typeof opts === 'object') {
      host     = opts.hostname || (opts.host ? opts.host.split(':')[0] : 'localhost');
      pathname = opts.path || '/';
      method   = (opts.method || 'GET').toUpperCase();
      const p  = opts.port ? `:${opts.port}` : '';
      urlStr   = `${proto}://${host}${p}${pathname}`;
    } else {
      return original.call(this, opts, cb);
    }

    /* ---- skip devflow & AI ---- */
    const optsPort = typeof opts === 'object' ? String(opts.port || '') : '';
    if (SKIP.has(host)) return original.call(this, opts, cb);
    if ((host === 'localhost' || host === '127.0.0.1') && optsPort === String(PORT))
      return original.call(this, opts, cb);

    /* ---- record ---- */
    const id        = ++seq;
    const startTime = Date.now();
    const record    = {
      id, method, url: urlStr, host, path: pathname, proto,
      timestamp: new Date().toISOString(),
      status: null, duration: null,
      requestBody: '', responseBody: '', error: null,
    };

    calls.push(record);
    if (calls.length > MAX_CALLS) calls.shift();
    bus.emit('call:start', snap(record));

    /* ---- make real request ---- */
    const req = original.call(this, opts, function (res) {
      record.status = res.statusCode;
      const chunks  = [];
      res.on('data',  c  => chunks.push(c));
      res.on('end',  () => {
        record.duration = Date.now() - startTime;
        try { record.responseBody = Buffer.concat(chunks).toString('utf8').slice(0, 800); } catch {}
        bus.emit('call:complete', snap(record));
      });
      if (cb) cb(res);
    });

    /* capture request body */
    const ow = req.write.bind(req);
    req.write = function (data) {
      try { if (data) record.requestBody += (typeof data === 'string' ? data : data.toString('utf8')).slice(0, 400); } catch {}
      return ow(data);
    };

    req.on('error', err => {
      record.duration = Date.now() - startTime;
      record.error    = err.message;
      bus.emit('call:error', snap(record));
    });

    return req;
  };
}

function snap(r) { return { ...r }; }

/* patch http/https */
http.request  = wrap(http.request,  'http');
https.request = wrap(https.request, 'https');
http.get  = (o, c) => { const r = http.request(o, c);  r.end(); return r; };
https.get = (o, c) => { const r = https.request(o, c); r.end(); return r; };

/* patch global fetch (Node 18+ / undici) — needed for Anthropic SDK, etc. */
if (typeof globalThis.fetch === 'function') {
  const _origFetch = globalThis.fetch;
  globalThis.fetch = async function devflowFetch(input, init) {
    const url    = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input?.url ?? ''));
    const method = (init?.method || (typeof input === 'object' && !(input instanceof URL) ? input.method : null) || 'GET').toUpperCase();
    let parsed;
    try { parsed = new URL(url); } catch { parsed = { hostname: '', pathname: url, protocol: 'https:' }; }

    const id = ++seq;
    const startTime = Date.now();
    const record = {
      id, method, url, host: parsed.hostname, path: parsed.pathname, proto: parsed.protocol?.replace(':', '') || 'https',
      timestamp: new Date().toISOString(),
      status: null, duration: null,
      requestBody: '', responseBody: '', error: null,
    };

    // Capture request body
    if (init?.body) {
      try { record.requestBody = (typeof init.body === 'string' ? init.body : init.body.toString()).slice(0, 400); } catch {}
    }

    calls.push(record);
    if (calls.length > MAX_CALLS) calls.shift();
    bus.emit('call:start', snap(record));

    try {
      const res = await _origFetch.call(this, input, init);
      record.status   = res.status;
      record.duration = Date.now() - startTime;

      // Clone and read a slice of the response body
      try {
        const clone = res.clone();
        const text  = await clone.text();
        record.responseBody = text.slice(0, 800);
      } catch {}

      bus.emit('call:complete', snap(record));
      return res;
    } catch (err) {
      record.duration = Date.now() - startTime;
      record.error    = err.message;
      bus.emit('call:error', snap(record));
      throw err;
    }
  };
}

// ═══════════════════════════════════════════════════
//  Dashboard WebSocket + HTTP Server
//  Guard: only start once (Next.js forks workers that inherit -r preload)
// ═══════════════════════════════════════════════════
if (!global.__devflow_started) {
  global.__devflow_started = true;

  let WSServer;
  try { WSServer = require('ws').Server; }
  catch { console.error('\n[devflow] Run: cd devflow && npm install\n'); process.exit(1); }

  const srv = new (require('http').Server)((req, res) => {
    if (req.url === '/api/calls') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(calls));
    }

    // Ingest endpoint — receives call records from Next.js instrumentation hook
    if (req.url === '/api/ingest' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const msg = JSON.parse(body);
          if (msg.type === 'ingest' && msg.call) {
            const record = msg.call;
            calls.push(record);
            if (calls.length > MAX_CALLS) calls.shift();
            if (msg.event === 'start')         bus.emit('call:start',    snap(record));
            else if (msg.event === 'complete') bus.emit('call:complete', snap(record));
            else if (msg.event === 'error')    bus.emit('call:error',    snap(record));
          }
        } catch {}
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('ok');
      });
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(DASHBOARD_HTML);
  });

  const wss     = new WSServer({ noServer: true });
  const clients = new Set();

  srv.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
  });

  wss.on('connection', ws => {
    clients.add(ws);
    send(ws, { type: 'init', calls: calls.slice(-200) });

    ws.on('message', async raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'analyze') {
          send(ws, { type: 'analyzing' });
          const result = await aiAnalyze(calls);
          send(ws, { type: 'analysis', ...result });
        }
        if (msg.type === 'clear') {
          calls.length = 0; seq = 0;
          broadcast({ type: 'cleared' });
        }
      } catch (e) {
        send(ws, { type: 'ai_error', message: e.message });
      }
    });

    ws.on('close', () => clients.delete(ws));
  });

  function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
  function broadcast(obj) { const j = JSON.stringify(obj); clients.forEach(c => { if (c.readyState === 1) c.send(j); }); }

  bus.on('call:start',    c => broadcast({ type: 'call:start',    call: c }));
  bus.on('call:complete', c => broadcast({ type: 'call:complete', call: c }));
  bus.on('call:error',    c => broadcast({ type: 'call:error',    call: c }));

  srv.listen(PORT, () => {
    const line = '─'.repeat(42);
    process.stdout.write(`\n\x1b[36m ┌${line}┐\n │  🔍 devflow  →  \x1b[1mhttp://localhost:${PORT}\x1b[22m              │\n └${line}┘\x1b[0m\n\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Already running in parent process — silently skip in forked worker
    } else {
      throw err;
    }
  });
}

// ═══════════════════════════════════════════════════
//  Claude AI Analysis
// ═══════════════════════════════════════════════════
async function aiAnalyze(callList) {
  const recent = callList.slice(-150);

  /* group by service */
  const svc = {};
  for (const c of recent) {
    if (!svc[c.host]) svc[c.host] = { n: 0, methods: new Set(), paths: new Set(), codes: new Set() };
    svc[c.host].n++;
    svc[c.host].methods.add(c.method);
    svc[c.host].paths.add(c.path.split('?')[0].slice(0, 40));
    if (c.status) svc[c.host].codes.add(c.status);
  }

  const svcSummary = Object.entries(svc)
    .map(([h, v]) =>
      `• ${h}  (${v.n} calls, methods: ${[...v.methods].join('/')}, ` +
      `endpoints: ${[...v.paths].slice(0,4).join(' ')}, ` +
      `status: ${[...v.codes].join('/')})`
    ).join('\n');

  const recentLog = recent.slice(-30)
    .map(c => `[${c.timestamp.slice(11,19)}] ${c.method.padEnd(6)} ${c.url.slice(0,70)} → ${c.status || '…'} (${c.duration ?? '?'}ms)`)
    .join('\n');

  const body = JSON.stringify({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a senior systems architect. Analyze API calls captured from a live application.

SERVICES:
${svcSummary}

RECENT LOG (last 30 calls):
${recentLog}

Return ONLY a raw JSON object — no markdown, no code fences — with exactly:
{
  "title":        "brief descriptive title",
  "mermaid":      "sequenceDiagram or graph TD mermaid code (valid mermaid syntax)",
  "explanation":  "2-3 paragraph system design explanation",
  "observations": ["observation 1", "observation 2", "observation 3"],
  "services":     [{"name":"hostname","role":"what it does","calls": N}]
}`
    }]
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is not set');

  const res  = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.content[0].text.replace(/^```[a-z]*\n?|```$/gm, '').trim();
  return JSON.parse(text);
}

// ═══════════════════════════════════════════════════
//  Embedded Dashboard HTML
// ═══════════════════════════════════════════════════
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>devflow</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Space+Grotesk:wght@300;400;600;700&display=swap');

  :root {
    --bg:       #09090f;
    --bg2:      #0e0e17;
    --bg3:      #13131f;
    --border:   #1e1e30;
    --border2:  #2a2a42;
    --text:     #c8c8e0;
    --dim:      #5a5a80;
    --accent:   #7b6cff;
    --cyan:     #00e5c8;
    --green:    #00e084;
    --yellow:   #f5c842;
    --red:      #ff4e6a;
    --orange:   #ff8c42;
    --white:    #eeeeff;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    height: 100%; overflow: hidden;
    background: var(--bg); color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }

  /* ── layout ── */
  .app { display: grid; grid-template-rows: 44px 1fr; height: 100vh; }

  .topbar {
    display: flex; align-items: center; gap: 14px;
    padding: 0 16px;
    background: var(--bg2);
    border-bottom: 1px solid var(--border);
    position: relative; z-index: 10;
  }

  .logo {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700; font-size: 15px; letter-spacing: -.5px;
    color: var(--white);
  }
  .logo span { color: var(--accent); }

  .badge {
    padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 500;
    background: var(--bg3); border: 1px solid var(--border2);
    color: var(--dim); font-family: 'JetBrains Mono', monospace;
  }
  .badge.live { border-color: var(--green); color: var(--green); }
  .badge.live::before { content: '● '; }
  .badge.err  { border-color: var(--red); color: var(--red); }

  .stat { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 0 12px; }
  .stat-val { font-size: 14px; font-weight: 700; color: var(--white); line-height: 1; }
  .stat-lbl { font-size: 9px; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; }

  .sep { width: 1px; height: 24px; background: var(--border); }

  .spacer { flex: 1; }

  .btn {
    padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border2);
    background: var(--bg3); color: var(--text); font-family: 'JetBrains Mono', monospace;
    font-size: 11px; cursor: pointer; transition: all .15s;
    display: flex; align-items: center; gap: 6px;
  }
  .btn:hover { border-color: var(--accent); color: var(--white); background: rgba(123,108,255,.08); }
  .btn.primary {
    border-color: var(--accent); color: var(--accent);
    box-shadow: 0 0 12px rgba(123,108,255,.15);
  }
  .btn.primary:hover { background: rgba(123,108,255,.15); }
  .btn:disabled { opacity: .4; cursor: not-allowed; }

  /* ── main panels ── */
  .panels { display: grid; grid-template-columns: 420px 1fr; overflow: hidden; }

  /* ── call feed ── */
  .feed {
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow: hidden;
  }

  .feed-header {
    padding: 10px 14px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
    background: var(--bg2);
    font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--dim);
  }
  .feed-header strong { color: var(--text); font-size: 11px; text-transform: none; letter-spacing: 0; }

  .feed-list {
    flex: 1; overflow-y: auto; padding: 6px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }

  .call-item {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 7px 9px; border-radius: 6px; margin-bottom: 3px;
    background: var(--bg2); border: 1px solid transparent;
    cursor: pointer; transition: all .1s;
    animation: slideIn .2s ease-out;
  }
  .call-item:hover { border-color: var(--border2); background: var(--bg3); }
  .call-item.selected { border-color: var(--accent); background: rgba(123,108,255,.06); }
  .call-item.pending { opacity: .7; }
  .call-item.error   { border-left: 2px solid var(--red); }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .method {
    width: 44px; padding: 2px 5px; border-radius: 3px; font-size: 9px; font-weight: 700;
    text-align: center; flex-shrink: 0; line-height: 1.6;
  }
  .GET    { background: rgba(0,229,200,.1);  color: var(--cyan);   border: 1px solid rgba(0,229,200,.2); }
  .POST   { background: rgba(0,224,132,.1);  color: var(--green);  border: 1px solid rgba(0,224,132,.2); }
  .PUT    { background: rgba(245,200,66,.1); color: var(--yellow); border: 1px solid rgba(245,200,66,.2); }
  .PATCH  { background: rgba(255,140,66,.1); color: var(--orange); border: 1px solid rgba(255,140,66,.2); }
  .DELETE { background: rgba(255,78,106,.1); color: var(--red);    border: 1px solid rgba(255,78,106,.2); }

  .call-info { flex: 1; min-width: 0; }
  .call-url  { color: var(--white); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .call-host { font-size: 10px; color: var(--dim); margin-top: 2px; }

  .call-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
  .status-dot {
    font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 3px;
  }
  .s2xx { color: var(--green);  background: rgba(0,224,132,.1); }
  .s3xx { color: var(--cyan);   background: rgba(0,229,200,.1); }
  .s4xx { color: var(--yellow); background: rgba(245,200,66,.1); }
  .s5xx { color: var(--red);    background: rgba(255,78,106,.1); }
  .s-pending { color: var(--dim); }
  .s-err     { color: var(--red); }

  .duration { font-size: 9px; color: var(--dim); }

  /* ── detail / analysis pane ── */
  .right { display: flex; flex-direction: column; overflow: hidden; }

  .tabs {
    display: flex; border-bottom: 1px solid var(--border);
    background: var(--bg2); padding: 0 16px; gap: 4px;
  }
  .tab {
    padding: 10px 14px; font-size: 11px; color: var(--dim);
    border-bottom: 2px solid transparent; cursor: pointer;
    transition: all .15s; margin-bottom: -1px;
  }
  .tab:hover  { color: var(--text); }
  .tab.active { color: var(--white); border-bottom-color: var(--accent); }

  .tab-content { flex: 1; overflow-y: auto; padding: 20px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .tab-pane { display: none; }
  .tab-pane.active { display: block; }

  /* ── detail view ── */
  .detail-empty {
    height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; color: var(--dim);
  }
  .detail-empty svg { opacity: .3; }

  .detail-section { margin-bottom: 20px; }
  .detail-section h3 {
    font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
    color: var(--dim); margin-bottom: 8px;
  }
  .kv-row { display: flex; gap: 12px; margin-bottom: 4px; font-size: 11px; }
  .kv-key { color: var(--dim); width: 90px; flex-shrink: 0; }
  .kv-val { color: var(--white); word-break: break-all; }

  .code-block {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 6px;
    padding: 12px; font-size: 11px; color: var(--cyan);
    white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto;
  }

  /* ── analysis ── */
  .analyze-prompt {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; gap: 16px; text-align: center; color: var(--dim);
  }
  .analyze-prompt h2 { color: var(--text); font-size: 18px; font-family: 'Space Grotesk', sans-serif; }

  .analysis-content { animation: fadeUp .4s ease-out; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .analysis-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px; font-weight: 700; color: var(--white);
    margin-bottom: 16px;
  }

  .analysis-explanation {
    line-height: 1.7; font-size: 12px; color: var(--text);
    margin-bottom: 20px; font-family: 'Space Grotesk', sans-serif; font-weight: 300;
  }

  .obs-list { margin-bottom: 20px; }
  .obs-item {
    display: flex; gap: 10px; padding: 8px 12px;
    background: var(--bg3); border: 1px solid var(--border); border-radius: 6px;
    margin-bottom: 6px; font-size: 11px; color: var(--text);
    font-family: 'Space Grotesk', sans-serif;
  }
  .obs-item::before { content: '→'; color: var(--accent); flex-shrink: 0; }

  .services-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; margin-bottom: 20px;
  }
  .svc-card {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 12px;
  }
  .svc-card-name { font-size: 12px; color: var(--cyan); margin-bottom: 4px; word-break: break-all; }
  .svc-card-role { font-size: 11px; color: var(--dim); font-family: 'Space Grotesk', sans-serif; }
  .svc-card-calls { font-size: 18px; font-weight: 700; color: var(--white); margin-top: 6px; }

  .mermaid-wrap {
    background: var(--bg3); border: 1px solid var(--border); border-radius: 8px;
    padding: 20px; margin-bottom: 20px; overflow-x: auto;
  }
  .mermaid-wrap .mermaid svg { max-width: 100%; }

  .spinner {
    width: 24px; height: 24px; border: 2px solid var(--border);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .analyzing-msg {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; gap: 16px; color: var(--dim);
  }
  .analyzing-msg p { font-family: 'Space Grotesk', sans-serif; }

  /* ── timeline ── */
  .timeline-wrap { padding: 0 4px; }
  .tl-item {
    display: flex; align-items: center; gap: 10px; padding: 6px 0;
    border-bottom: 1px solid var(--border); font-size: 11px;
    animation: slideIn .2s ease-out;
  }
  .tl-time { color: var(--dim); width: 60px; flex-shrink: 0; font-size: 10px; }
  .tl-method { width: 44px; flex-shrink: 0; }
  .tl-bar-wrap { flex: 1; position: relative; height: 4px; background: var(--bg3); border-radius: 2px; }
  .tl-bar { height: 100%; border-radius: 2px; background: var(--accent); min-width: 2px; }
  .tl-dur { width: 50px; text-align: right; color: var(--dim); font-size: 10px; }

  /* scrollbar styling */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .empty-state { text-align: center; padding: 40px; color: var(--dim); }
  .empty-state p { margin-top: 8px; font-family: 'Space Grotesk', sans-serif; }
</style>
</head>
<body>
<div class="app">

  <!-- ── Topbar ── -->
  <div class="topbar">
    <div class="logo">dev<span>flow</span></div>
    <div class="sep"></div>
    <div id="conn-badge" class="badge">connecting…</div>
    <div class="sep"></div>
    <div class="stat"><div class="stat-val" id="s-total">0</div><div class="stat-lbl">total</div></div>
    <div class="stat"><div class="stat-val" id="s-ok" style="color:var(--green)">0</div><div class="stat-lbl">2xx</div></div>
    <div class="stat"><div class="stat-val" id="s-err" style="color:var(--red)">0</div><div class="stat-lbl">errors</div></div>
    <div class="stat"><div class="stat-val" id="s-avg">—</div><div class="stat-lbl">avg ms</div></div>
    <div class="spacer"></div>
    <button class="btn" onclick="clearCalls()">✕ Clear</button>
    <button class="btn primary" id="analyze-btn" onclick="requestAnalysis()">
      ✦ AI Analyze
    </button>
  </div>

  <!-- ── Panels ── -->
  <div class="panels">

    <!-- ── Left: call feed ── -->
    <div class="feed">
      <div class="feed-header">
        <strong>Live Calls</strong>
        <span style="flex:1"></span>
        <span id="feed-count" style="color:var(--dim)">0 calls</span>
      </div>
      <div class="feed-list" id="feed"></div>
    </div>

    <!-- ── Right: detail + analysis ── -->
    <div class="right">
      <div class="tabs">
        <div class="tab active" onclick="showTab('detail',this)">Request Detail</div>
        <div class="tab" onclick="showTab('analysis',this)">System Analysis</div>
        <div class="tab" onclick="showTab('timeline',this)">Timeline</div>
      </div>
      <div class="tab-content">

        <div class="tab-pane active" id="tab-detail">
          <div class="detail-empty" id="detail-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
            </svg>
            <p>Click a call to inspect it</p>
          </div>
          <div id="detail-content" style="display:none"></div>
        </div>

        <div class="tab-pane" id="tab-analysis">
          <div id="analysis-area">
            <div class="analyze-prompt">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--accent);opacity:.6">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <h2>AI System Analysis</h2>
              <p>Record some traffic, then click<br><strong style="color:var(--accent)">✦ AI Analyze</strong> to generate<br>a system design diagram & explanation.</p>
            </div>
          </div>
        </div>

        <div class="tab-pane" id="tab-timeline">
          <div id="timeline-area">
            <div class="empty-state">
              <p>No calls yet. Start your app and traffic will appear here.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>

<script>
  // ── State ──
  const callMap = new Map();   // id → record
  let selectedId  = null;
  let analysisData = null;
  const stats = { total: 0, ok: 0, err: 0, durations: [] };

  // ── WebSocket ──
  const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
  let ws;

  function connect() {
    ws = new WebSocket(wsProto + '://' + location.host);

    ws.onopen = () => {
      document.getElementById('conn-badge').textContent = '● live';
      document.getElementById('conn-badge').className = 'badge live';
    };

    ws.onclose = () => {
      document.getElementById('conn-badge').textContent = 'disconnected';
      document.getElementById('conn-badge').className = 'badge err';
      setTimeout(connect, 2000);
    };

    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'init') {
        msg.calls.forEach(c => addCall(c, false));
        renderTimeline();
      }
      else if (msg.type === 'call:start')    { addCall(msg.call, true); }
      else if (msg.type === 'call:complete') { updateCall(msg.call); }
      else if (msg.type === 'call:error')    { updateCall(msg.call); }
      else if (msg.type === 'cleared')       { clearLocal(); }
      else if (msg.type === 'analyzing')     { showAnalyzing(); }
      else if (msg.type === 'analysis')      { showAnalysis(msg); }
      else if (msg.type === 'ai_error')      { showAnalysisError(msg.message); }
    };
  }

  connect();

  // ── Call management ──
  function addCall(c, live) {
    callMap.set(c.id, c);
    stats.total++;
    if (c.status && c.status >= 200 && c.status < 300) stats.ok++;
    else if (c.status && c.status >= 400) stats.err++;
    updateStats();
    renderCallItem(c, live);
    renderTimeline();
  }

  function updateCall(c) {
    callMap.set(c.id, c);
    if (c.status >= 200 && c.status < 300) stats.ok++;
    else if (c.status >= 400 || c.error)   stats.err++;
    if (c.duration) stats.durations.push(c.duration);
    updateStats();

    const el = document.getElementById('call-' + c.id);
    if (el) {
      el.classList.remove('pending');
      if (c.error) el.classList.add('error');
      const meta = el.querySelector('.call-meta');
      if (meta) {
        meta.innerHTML =
          '<div class="status-dot ' + statusClass(c.status, c.error) + '">' +
          (c.error ? 'ERR' : c.status || '?') + '</div>' +
          '<div class="duration">' + (c.duration ? c.duration + 'ms' : '') + '</div>';
      }
    }

    if (selectedId === c.id) renderDetail(c);
    renderTimeline();
  }

  function clearLocal() {
    callMap.clear();
    Object.assign(stats, { total: 0, ok: 0, err: 0, durations: [] });
    selectedId = null;
    document.getElementById('feed').innerHTML = '';
    updateStats();
    document.getElementById('detail-empty').style.display = '';
    document.getElementById('detail-content').style.display = 'none';
    renderTimeline();
  }

  // ── Render ──
  function renderCallItem(c, live) {
    const feed = document.getElementById('feed');
    const div  = document.createElement('div');
    div.id        = 'call-' + c.id;
    div.className = 'call-item' + (c.status ? '' : ' pending') + (c.error ? ' error' : '');
    div.onclick   = () => selectCall(c.id);

    const pathShort = c.path.length > 30 ? c.path.slice(0, 30) + '…' : c.path;

    div.innerHTML = \`
      <div class="method \${c.method}">\${c.method.slice(0,6)}</div>
      <div class="call-info">
        <div class="call-url">\${pathShort}</div>
        <div class="call-host">\${c.host}</div>
      </div>
      <div class="call-meta">
        <div class="status-dot \${statusClass(c.status, c.error)}">
          \${c.error ? 'ERR' : c.status || '…'}
        </div>
        <div class="duration">\${c.duration ? c.duration + 'ms' : ''}</div>
      </div>\`;

    feed.insertBefore(div, feed.firstChild);

    // keep feed trimmed to 300 visible items
    while (feed.children.length > 300) feed.removeChild(feed.lastChild);
  }

  function selectCall(id) {
    if (selectedId) {
      const prev = document.getElementById('call-' + selectedId);
      if (prev) prev.classList.remove('selected');
    }
    selectedId = id;
    const el = document.getElementById('call-' + id);
    if (el) el.classList.add('selected');
    const c = callMap.get(id);
    if (c) { renderDetail(c); showTab('detail'); }
  }

  function renderDetail(c) {
    document.getElementById('detail-empty').style.display = 'none';
    const el = document.getElementById('detail-content');
    el.style.display = '';

    const tryJSON = s => {
      try { return JSON.stringify(JSON.parse(s), null, 2); }
      catch { return s || '—'; }
    };

    el.innerHTML = \`
      <div class="detail-section">
        <h3>Request</h3>
        <div class="kv-row"><div class="kv-key">Method</div><div class="kv-val">\${c.method}</div></div>
        <div class="kv-row"><div class="kv-key">URL</div><div class="kv-val">\${c.url}</div></div>
        <div class="kv-row"><div class="kv-key">Host</div><div class="kv-val">\${c.host}</div></div>
        <div class="kv-row"><div class="kv-key">Path</div><div class="kv-val">\${c.path}</div></div>
        <div class="kv-row"><div class="kv-key">Protocol</div><div class="kv-val">\${c.proto}</div></div>
        <div class="kv-row"><div class="kv-key">Time</div><div class="kv-val">\${c.timestamp}</div></div>
      </div>

      <div class="detail-section">
        <h3>Response</h3>
        <div class="kv-row"><div class="kv-key">Status</div>
          <div class="kv-val"><span class="status-dot \${statusClass(c.status, c.error)}">\${c.error ? 'ERROR' : c.status || 'pending'}</span></div>
        </div>
        <div class="kv-row"><div class="kv-key">Duration</div><div class="kv-val">\${c.duration ? c.duration + ' ms' : '—'}</div></div>
        \${c.error ? '<div class="kv-row"><div class="kv-key">Error</div><div class="kv-val" style="color:var(--red)">' + c.error + '</div></div>' : ''}
      </div>

      \${c.requestBody ? \`<div class="detail-section">
        <h3>Request Body</h3>
        <div class="code-block">\${escHtml(tryJSON(c.requestBody))}</div>
      </div>\` : ''}

      \${c.responseBody ? \`<div class="detail-section">
        <h3>Response Body</h3>
        <div class="code-block">\${escHtml(tryJSON(c.responseBody))}</div>
      </div>\` : ''}
    \`;
  }

  function renderTimeline() {
    const area   = document.getElementById('timeline-area');
    const recent = [...callMap.values()].slice(-60).reverse();
    if (!recent.length) {
      area.innerHTML = '<div class="empty-state"><p>No calls yet.</p></div>';
      return;
    }
    const maxDur = Math.max(...recent.map(c => c.duration || 0), 1);
    area.innerHTML = '<div class="timeline-wrap">' +
      recent.map(c => {
        const pct = ((c.duration || 0) / maxDur * 100).toFixed(1);
        return \`<div class="tl-item">
          <div class="tl-time">\${c.timestamp.slice(11,19)}</div>
          <div class="tl-method"><div class="method \${c.method}" style="width:38px;font-size:8px">\${c.method.slice(0,5)}</div></div>
          <div class="tl-bar-wrap"><div class="tl-bar" style="width:\${pct}%;background:\${barColor(c)}"></div></div>
          <div class="tl-dur">\${c.duration ?? '—'}ms</div>
        </div>\`;
      }).join('') + '</div>';
  }

  function barColor(c) {
    if (c.error || (c.status >= 500)) return 'var(--red)';
    if (c.status >= 400) return 'var(--yellow)';
    if (c.duration > 1000) return 'var(--orange)';
    return 'var(--accent)';
  }

  // ── Analysis ──
  function requestAnalysis() {
    if (callMap.size === 0) return alert('No calls recorded yet. Start your app first.');
    ws.send(JSON.stringify({ type: 'analyze' }));
    showTab('analysis');
    const tabEl = document.querySelector('.tab:nth-child(2)');
    showTab('analysis', tabEl);
  }

  function showAnalyzing() {
    document.getElementById('analysis-area').innerHTML = \`
      <div class="analyzing-msg">
        <div class="spinner"></div>
        <p>Claude is analyzing your system architecture…</p>
      </div>\`;
  }

  function showAnalysis(data) {
    analysisData = data;
    const html = \`
      <div class="analysis-content">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div class="analysis-title" style="margin-bottom:0">\${escHtml(data.title || 'System Architecture')}</div>
          <button class="btn" onclick="downloadAnalysis()" style="flex-shrink:0">↓ Download Report</button>
        </div>

        <div class="detail-section"><h3>Architecture Diagram</h3>
          <div class="mermaid-wrap"><div class="mermaid">\${data.mermaid || ''}</div></div>
        </div>

        \${data.services && data.services.length ? \`
        <div class="detail-section"><h3>Services Detected (\${data.services.length})</h3>
          <div class="services-grid">
            \${data.services.map(s => \`
              <div class="svc-card">
                <div class="svc-card-name">\${escHtml(s.name)}</div>
                <div class="svc-card-role">\${escHtml(s.role || '')}</div>
                <div class="svc-card-calls">\${s.calls || ''} <span style="font-size:10px;color:var(--dim)">calls</span></div>
              </div>\`).join('')}
          </div>
        </div>\` : ''}

        \${data.observations && data.observations.length ? \`
        <div class="detail-section"><h3>Key Observations</h3>
          <div class="obs-list">
            \${data.observations.map(o => \`<div class="obs-item">\${escHtml(o)}</div>\`).join('')}
          </div>
        </div>\` : ''}

        <div class="detail-section"><h3>Explanation</h3>
          <div class="analysis-explanation">\${escHtml(data.explanation || '')}</div>
        </div>
      </div>\`;

    document.getElementById('analysis-area').innerHTML = html;

    // Render mermaid
    try { mermaid.run({ nodes: document.querySelectorAll('.mermaid') }); } catch {}
  }

  function showAnalysisError(msg) {
    document.getElementById('analysis-area').innerHTML = \`
      <div class="analyze-prompt">
        <p style="color:var(--red)">Analysis failed: \${escHtml(msg)}</p>
        <p>Make sure the app has network access to api.anthropic.com</p>
      </div>\`;
  }

  function downloadAnalysis() {
    if (!analysisData) return;
    var d = analysisData;
    var fence = String.fromCharCode(96,96,96);
    var nl = String.fromCharCode(10);
    var parts = [];
    parts.push('# ' + (d.title || 'System Architecture Analysis'));
    parts.push('');
    parts.push('## Architecture Diagram');
    parts.push(fence + 'mermaid');
    parts.push(d.mermaid || '');
    parts.push(fence);
    parts.push('');
    if (d.services && d.services.length) {
      parts.push('## Services');
      d.services.forEach(function(s) { parts.push('- **' + s.name + '** — ' + (s.role || '') + ' (' + (s.calls || 0) + ' calls)'); });
      parts.push('');
    }
    if (d.observations && d.observations.length) {
      parts.push('## Key Observations');
      d.observations.forEach(function(o) { parts.push('- ' + o); });
      parts.push('');
    }
    parts.push('## Explanation');
    parts.push(d.explanation || '');
    parts.push('');
    parts.push('---');
    parts.push('*Generated by devflow AI Analysis — ' + new Date().toISOString().slice(0,19) + '*');
    var md = parts.join(nl);
    var blob = new Blob([md], { type: 'text/markdown' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'devflow-analysis-' + new Date().toISOString().slice(0,10) + '.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Helpers ──
  function updateStats() {
    document.getElementById('s-total').textContent = stats.total;
    document.getElementById('s-ok').textContent    = stats.ok;
    document.getElementById('s-err').textContent   = stats.err;
    const avg = stats.durations.length
      ? Math.round(stats.durations.reduce((a,b) => a+b, 0) / stats.durations.length)
      : null;
    document.getElementById('s-avg').textContent = avg ? avg + 'ms' : '—';
    document.getElementById('feed-count').textContent = callMap.size + ' calls';
  }

  function statusClass(status, err) {
    if (err) return 's-err';
    if (!status) return 's-pending';
    if (status < 300) return 's2xx';
    if (status < 400) return 's3xx';
    if (status < 500) return 's4xx';
    return 's5xx';
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function clearCalls() { ws.send(JSON.stringify({ type: 'clear' })); }

  function showTab(name, clickedEl) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    if (clickedEl) clickedEl.classList.add('active');
    else {
      const idx = ['detail','analysis','timeline'].indexOf(name);
      if (idx >= 0) document.querySelectorAll('.tab')[idx].classList.add('active');
    }
  }

  // Init mermaid
  mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: {
    background: '#13131f', primaryColor: '#7b6cff', primaryTextColor: '#eeeeff',
    primaryBorderColor: '#2a2a42', lineColor: '#5a5a80', secondaryColor: '#0e0e17',
    tertiaryColor: '#1e1e30',
  }});
</script>
</body>
</html>`;

module.exports = { bus, calls };
