const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PORT = Number(process.env.PORT || 8089);
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const PG_USER = process.env.POSTGRES_USER || 'quadra_admin';
const PG_DB = process.env.POSTGRES_DB || 'quadra_aberta_db';

const CONTAINERS = [
  { key: 'tunnel', name: 'quadra_aberta_quick_tunnel', label: 'Cloudflare Tunnel', role: 'Exposição HTTPS Pública' },
  { key: 'web', name: 'quadra_aberta_web_prod', label: 'Frontend & Proxy (Nginx)', role: 'Interface React + Proxy' },
  { key: 'api', name: 'quadra_aberta_api_prod', label: 'Backend API (Spring Boot)', role: 'Regras de Negócio & JWT' },
  { key: 'pg', name: 'quadra_aberta_pg_prod', label: 'PostgreSQL 16', role: 'Banco de Dados' },
];

const PUBLIC_HTML_PATH = path.join(__dirname, 'public', 'index.html');

function dockerRequest(method, reqPath, body = null, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      socketPath: DOCKER_SOCKET,
      path: reqPath,
      method,
      headers: payload
        ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          }
        : {},
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, buffer });
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout calling Docker socket: ${method} ${reqPath}`));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function dockerJson(method, reqPath, body = null) {
  const res = await dockerRequest(method, reqPath, body);
  const text = res.buffer.toString('utf8');
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

/**
 * Demultiplex Docker multiplexed stdout/stderr stream (8-byte frame header)
 * or return plain UTF-8 text when TTY is enabled.
 */
function decodeDockerLogs(buffer) {
  if (!buffer || buffer.length === 0) return '';
  const lines = [];
  let offset = 0;

  while (offset + 8 <= buffer.length) {
    const streamType = buffer[offset];
    const zero1 = buffer[offset + 1];
    const zero2 = buffer[offset + 2];
    const zero3 = buffer[offset + 3];
    if ((streamType === 1 || streamType === 2 || streamType === 0) && zero1 === 0 && zero2 === 0 && zero3 === 0) {
      const frameLen = buffer.readUInt32BE(offset + 4);
      offset += 8;
      if (offset + frameLen > buffer.length) {
        lines.push(buffer.slice(offset).toString('utf8'));
        break;
      }
      lines.push(buffer.slice(offset, offset + frameLen).toString('utf8'));
      offset += frameLen;
    } else {
      return buffer.toString('utf8');
    }
  }

  return lines.join('');
}

async function getContainerLogs(containerName, tail = 200) {
  const res = await dockerRequest(
    'GET',
    `/containers/${encodeURIComponent(containerName)}/logs?stdout=1&stderr=1&tail=${tail}`
  );
  if (res.status >= 400) return '';
  return decodeDockerLogs(res.buffer);
}

async function inspectContainer(c) {
  const res = await dockerJson('GET', `/containers/${encodeURIComponent(c.name)}/json`);
  if (res.status === 404 || !res.data) {
    return {
      ...c,
      exists: false,
      running: false,
      status: 'missing',
      health: null,
      startedAt: null,
      memoryMb: null,
      cpuPercent: null,
    };
  }

  const state = res.data.State || {};
  const running = Boolean(state.Running);
  const health = state.Health ? state.Health.Status : null;

  let memoryMb = null;
  let cpuPercent = null;

  if (running) {
    try {
      const statsRes = await dockerJson(
        'GET',
        `/containers/${encodeURIComponent(c.name)}/stats?stream=false`
      );
      if (statsRes.status === 200 && statsRes.data) {
        const mem = statsRes.data.memory_stats || {};
        if (typeof mem.usage === 'number') {
          const cache = (mem.stats && (mem.stats.inactive_file || mem.stats.cache)) || 0;
          memoryMb = Math.round(((mem.usage - cache) / (1024 * 1024)) * 10) / 10;
        }
        const cpuDelta =
          (statsRes.data.cpu_stats?.cpu_usage?.total_usage || 0) -
          (statsRes.data.precpu_stats?.cpu_usage?.total_usage || 0);
        const sysDelta =
          (statsRes.data.cpu_stats?.system_cpu_usage || 0) -
          (statsRes.data.precpu_stats?.system_cpu_usage || 0);
        const cpus = statsRes.data.cpu_stats?.online_cpus || 1;
        if (cpuDelta > 0 && sysDelta > 0) {
          cpuPercent = Math.round((cpuDelta / sysDelta) * cpus * 1000) / 10;
        } else {
          cpuPercent = 0;
        }
      }
    } catch {
      // Ignore stats error if container is transitioning
    }
  }

  return {
    ...c,
    exists: true,
    running,
    status: state.Status || 'unknown',
    health,
    startedAt: state.StartedAt || null,
    restartCount: res.data.RestartCount || 0,
    memoryMb,
    cpuPercent,
  };
}

function probeHttp(urlStr, timeoutMs = 4500) {
  return new Promise((resolve) => {
    if (!urlStr) return resolve({ ok: false, status: null, latencyMs: null });
    const start = Date.now();
    const lib = urlStr.startsWith('https://') ? https : http;
    const req = lib.get(urlStr, { timeout: timeoutMs }, (res) => {
      res.resume();
      resolve({
        ok: res.statusCode >= 200 && res.statusCode < 400,
        status: res.statusCode,
        latencyMs: Date.now() - start,
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 'TIMEOUT', latencyMs: Date.now() - start });
    });
    req.on('error', () => {
      resolve({ ok: false, status: 'ERR', latencyMs: Date.now() - start });
    });
  });
}

function fetchJson(urlStr, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get(urlStr, { timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

async function execPostgresCounts() {
  try {
    const createExec = await dockerJson('POST', '/containers/quadra_aberta_pg_prod/exec', {
      AttachStdout: true,
      AttachStderr: false,
      Cmd: [
        'psql',
        '-U',
        PG_USER,
        '-d',
        PG_DB,
        '-t',
        '-A',
        '-F',
        '|',
        '-c',
        "SELECT (SELECT count(*) FROM tb_usuario), (SELECT count(*) FROM tb_quadra), (SELECT count(*) FROM tb_partida_match WHERE status IN ('BUSCANDO_JOGADORES','QUADRA_DEFINIDA')), (SELECT count(*) FROM tb_reserva WHERE status = 'CONFIRMADA'), (SELECT count(*) FROM tb_turma_social WHERE ativo = true), (SELECT count(*) FROM tb_chamado_zeladoria), (SELECT count(*) FROM tb_mensagem_partida);",
      ],
    });
    if (createExec.status !== 201 || !createExec.data?.Id) return null;
    const startExec = await dockerRequest('POST', `/exec/${createExec.data.Id}/start`, {
      Detach: false,
      Tty: false,
    });
    const out = decodeDockerLogs(startExec.buffer).trim();
    const parts = out.split('|').map((v) => Number(v.trim()));
    if (parts.length === 7 && parts.every((n) => !Number.isNaN(n))) {
      return {
        usuarios: parts[0],
        quadras: parts[1],
        partidasAtivas: parts[2],
        reservasAtivas: parts[3],
        turmasAtivas: parts[4],
        chamados: parts[5],
        mensagensChat: parts[6],
      };
    }
    return null;
  } catch {
    return null;
  }
}

function maskIp(ip) {
  if (!ip || ip === '-') return 'local';
  const clean = ip.split(',')[0].trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  }
  if (clean.includes(':')) {
    return clean.split(':').slice(0, 3).join(':') + '::*';
  }
  return clean;
}

function parseAccessMetrics(rawLogs) {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  const activeIps = new Set();
  const uniqueIps = new Set();
  let totalRequests = 0;
  let pageViews = 0;
  let apiCalls = 0;
  let errors5xx = 0;
  const recent = [];

  const lines = rawLogs.split(/\r?\n/);
  for (const line of lines) {
    // Format: $time_iso8601|$http_cf_connecting_ip|$http_x_forwarded_for|$remote_addr|$request_method|$request_uri|$status
    if (!line.includes('|')) continue;
    const parts = line.split('|');
    if (parts.length < 7) continue;

    const [isoTime, cfIp, xff, remoteAddr, method, uri, statusStr] = parts;
    const ts = Date.parse(isoTime);
    if (Number.isNaN(ts)) continue;

    // Ignore internal dashboard probes to /api/quadras from 172.x without CF headers
    const isInternalProbe =
      (!cfIp || cfIp === '-') &&
      (!xff || xff === '-') &&
      uri === '/api/quadras' &&
      remoteAddr.startsWith('172.');
    if (isInternalProbe) continue;

    const realIp = (cfIp && cfIp !== '-' ? cfIp : xff && xff !== '-' ? xff.split(',')[0].trim() : remoteAddr) || 'unknown';
    const status = Number(statusStr) || 0;

    totalRequests++;
    uniqueIps.add(realIp);
    if (ts >= fiveMinAgo) activeIps.add(realIp);

    if (uri === '/' || uri === '/index.html') pageViews++;
    if (uri.startsWith('/api/')) apiCalls++;
    if (status >= 500) errors5xx++;

    if (!uri.startsWith('/assets/') && !uri.endsWith('.svg') && !uri.endsWith('.png') && !uri.endsWith('.ico')) {
      recent.push({
        time: isoTime,
        ip: maskIp(realIp),
        method,
        uri,
        status,
      });
    }
  }

  return {
    activeVisitors5m: activeIps.size,
    uniqueVisitorsTotal: uniqueIps.size,
    totalRequests,
    pageViews,
    apiCalls,
    errors5xx,
    recentRequests: recent.slice(-15).reverse(),
  };
}

async function getTunnelUrl() {
  const logs = await getContainerLogs('quadra_aberta_quick_tunnel', 250);
  const matches = logs.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g);
  return matches && matches.length > 0 ? matches[matches.length - 1] : null;
}

async function getDashboardSnapshot() {
  const [containers, tunnelUrl, webLogs] = await Promise.all([
    Promise.all(CONTAINERS.map(inspectContainer)),
    getTunnelUrl(),
    getContainerLogs('quadra_aberta_web_prod', 1500),
  ]);

  const byKey = Object.fromEntries(containers.map((c) => [c.key, c]));
  const isTunnelUp = Boolean(byKey.tunnel?.running);
  const isWebUp = Boolean(byKey.web?.running);
  const isApiUp = Boolean(byKey.api?.running);
  const isPgUp = Boolean(byKey.pg?.running);

  const [internalProbe, publicProbe, dbCounts, apiQuadras, apiPartidas] = await Promise.all([
    isWebUp ? probeHttp('http://frontend:80/api/quadras', 3000) : Promise.resolve({ ok: false, status: 'DOWN' }),
    isTunnelUp && tunnelUrl ? probeHttp(`${tunnelUrl}/api/quadras`, 5000) : Promise.resolve({ ok: false, status: 'DOWN' }),
    isPgUp ? execPostgresCounts() : Promise.resolve(null),
    isApiUp ? fetchJson('http://backend:8080/api/quadras', 2500) : Promise.resolve(null),
    isApiUp ? fetchJson('http://backend:8080/api/partidas', 2500) : Promise.resolve(null),
  ]);

  const access = parseAccessMetrics(webLogs);

  const domain = dbCounts || {
    usuarios: null,
    quadras: Array.isArray(apiQuadras) ? apiQuadras.length : null,
    partidasAtivas: Array.isArray(apiPartidas) ? apiPartidas.length : null,
    reservasAtivas: null,
    turmasAtivas: null,
    chamados: null,
    mensagensChat: null,
  };

  return {
    generatedAt: new Date().toISOString(),
    overallStatus: isPgUp && isApiUp && isWebUp ? (isTunnelUp ? 'ONLINE' : 'LOCAL_ONLY') : !isPgUp && !isApiUp && !isWebUp ? 'OFFLINE' : 'DEGRADED',
    tunnelUrl: isTunnelUp ? tunnelUrl : null,
    lastKnownTunnelUrl: tunnelUrl,
    probes: {
      internal: internalProbe,
      public: publicProbe,
    },
    access,
    domain,
    containers,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitContainerHealthy(name, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await dockerJson('GET', `/containers/${encodeURIComponent(name)}/json`);
    const st = res.data?.State;
    if (st?.Running && (!st.Health || st.Health.Status === 'healthy')) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function controlContainer(name, action) {
  if (action === 'start') {
    const res = await dockerRequest('POST', `/containers/${encodeURIComponent(name)}/start`);
    if (res.status >= 400 && res.status !== 304) throw new Error(`Falha ao iniciar ${name} (HTTP ${res.status})`);
  } else if (action === 'stop') {
    const res = await dockerRequest('POST', `/containers/${encodeURIComponent(name)}/stop?t=10`);
    if (res.status >= 400 && res.status !== 304) throw new Error(`Falha ao parar ${name} (HTTP ${res.status})`);
  } else if (action === 'restart') {
    const res = await dockerRequest('POST', `/containers/${encodeURIComponent(name)}/restart?t=10`);
    if (res.status >= 400) throw new Error(`Falha ao reiniciar ${name} (HTTP ${res.status})`);
  }
}

async function handleAction(target, action) {
  if (!['start', 'stop', 'restart'].includes(action)) {
    throw new Error('Ação inválida.');
  }

  if (target === 'all') {
    if (action === 'stop') {
      await controlContainer('quadra_aberta_quick_tunnel', 'stop').catch(() => {});
      await controlContainer('quadra_aberta_web_prod', 'stop').catch(() => {});
      await controlContainer('quadra_aberta_api_prod', 'stop').catch(() => {});
      await controlContainer('quadra_aberta_pg_prod', 'stop').catch(() => {});
    } else if (action === 'start') {
      await controlContainer('quadra_aberta_pg_prod', 'start');
      await waitContainerHealthy('quadra_aberta_pg_prod', 30000);
      await controlContainer('quadra_aberta_api_prod', 'start');
      await controlContainer('quadra_aberta_web_prod', 'start');
      await controlContainer('quadra_aberta_quick_tunnel', 'start');
    } else if (action === 'restart') {
      await controlContainer('quadra_aberta_pg_prod', 'restart');
      await waitContainerHealthy('quadra_aberta_pg_prod', 30000);
      await controlContainer('quadra_aberta_api_prod', 'restart');
      await controlContainer('quadra_aberta_web_prod', 'restart');
      await controlContainer('quadra_aberta_quick_tunnel', 'restart');
    }
    return { ok: true, message: `Ação '${action}' executada em toda a stack QuadraAberta.` };
  }

  const found = CONTAINERS.find((c) => c.key === target);
  if (!found) {
    throw new Error('Alvo desconhecido.');
  }

  await controlContainer(found.name, action);
  return { ok: true, message: `Ação '${action}' executada em ${found.label}.` };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const txt = Buffer.concat(chunks).toString('utf8');
        resolve(txt ? JSON.parse(txt) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    if (req.method === 'GET' && pathname === '/') {
      const html = fs.readFileSync(PUBLIC_HTML_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/dashboard/status') {
      const snapshot = await getDashboardSnapshot();
      sendJson(res, 200, snapshot);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/dashboard/qr.svg') {
      const targetUrl = urlObj.searchParams.get('url') || (await getTunnelUrl());
      if (!targetUrl) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Nenhuma URL ativa para gerar QR Code.');
        return;
      }
      const svg = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(svg);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/dashboard/logs') {
      const target = urlObj.searchParams.get('container') || 'api';
      const tail = Math.min(300, Math.max(20, Number(urlObj.searchParams.get('tail') || 80)));
      const found = CONTAINERS.find((c) => c.key === target);
      if (!found) {
        sendJson(res, 400, { error: 'Container inválido.' });
        return;
      }
      const logs = await getContainerLogs(found.name, tail);
      sendJson(res, 200, { container: found.name, logs });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/dashboard/action') {
      const body = await readJsonBody(req);
      const result = await handleAction(body.target, body.action);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, { error: 'Rota não encontrada.' });
  } catch (err) {
    sendJson(res, 500, { error: err.message || 'Erro interno no dashboard.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`QuadraAberta Control Dashboard rodando na porta ${PORT}`);
});
