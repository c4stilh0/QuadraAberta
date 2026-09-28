const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Decodifica o payload de um token JWT em Base64Url de forma segura com suporte UTF-8
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Verifica se um token JWT já expirou (com margem de segurança de 5 segundos)
export function isTokenExpired(token = getToken()) {
  if (!token) return true;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= (payload.exp * 1000) - 5000;
}

// Retorna quantos milissegundos restam até o token expirar
export function getTokenRemainingMs(token = getToken()) {
  if (!token) return 0;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return 0;
  const remaining = (payload.exp * 1000) - Date.now();
  return remaining > 0 ? remaining : 0;
}

let tokenExpirationTimer = null;

// Executa o logout automático e notifica toda a aplicação
export function triggerAutoLogout(message = 'Sua sessão expirou. Você foi desconectado automaticamente.') {
  clearTimeout(tokenExpirationTimer);
  tokenExpirationTimer = null;
  setToken(null);
  setCurrentUser(null);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('quadraaberta:session-expired', {
        detail: { message }
      })
    );
  }
}

// Inicia um monitor de expiração com timer preciso para disparar o logout no segundo exato da expiração
export function setupTokenWatcher(onExpiredCallback) {
  clearTimeout(tokenExpirationTimer);
  tokenExpirationTimer = null;

  const token = getToken();
  if (!token) return;

  if (isTokenExpired(token)) {
    triggerAutoLogout();
    onExpiredCallback?.('Sua sessão expirou.');
    return;
  }

  const msRemaining = getTokenRemainingMs(token);
  // Limita o timeout ao valor máximo seguro de setTimeout (~24.8 dias)
  const safeMs = Math.min(msRemaining, 2147483647);

  tokenExpirationTimer = setTimeout(() => {
    triggerAutoLogout();
    onExpiredCallback?.('Sua sessão expirou.');
  }, safeMs);
}

export function stopTokenWatcher() {
  clearTimeout(tokenExpirationTimer);
  tokenExpirationTimer = null;
}

export function getToken() {
  return localStorage.getItem('quadraaberta_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('quadraaberta_token', token);
    setupTokenWatcher();
  } else {
    localStorage.removeItem('quadraaberta_token');
    stopTokenWatcher();
  }
}

export function getCurrentUser() {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    if (token) {
      localStorage.removeItem('quadraaberta_token');
      localStorage.removeItem('quadraaberta_user');
      stopTokenWatcher();
    }
    return null;
  }
  const userJson = localStorage.getItem('quadraaberta_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('quadraaberta_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('quadraaberta_user');
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { ...options.headers };
  const isAuthEndpoint = endpoint.startsWith('/api/auth/');

  const token = getToken();

  // Se o token existe mas já expirou antes do envio de uma requisição protegida
  if (token && isTokenExpired(token) && !isAuthEndpoint) {
    triggerAutoLogout('Sua sessão expirou. Faça login novamente para continuar.');
    throw new Error('Sua sessão expirou. Faça login novamente para continuar.');
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Não define Content-Type se for FormData (o browser define com boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new Error('Não foi possível conectar ao servidor da API (porta 8080). Verifique se o backend está em execução.');
  }

  // Se a API retornar 401 Unauthorized em endpoint protegido, a sessão expirou ou é inválida
  if (response.status === 401 && !isAuthEndpoint) {
    const expiredHeader = response.headers.get('X-Token-Expired');
    const msg = expiredHeader === 'true'
      ? 'Sua sessão expirou. Você foi desconectado automaticamente por segurança.'
      : 'Sessão inválida ou expirada. Faça login novamente.';
    triggerAutoLogout(msg);
    throw new Error(msg);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMessage = data?.detail || data?.title || 'Ocorreu um erro ao processar a requisição.';
    if (data?.erros && typeof data.erros === 'object') {
      const fieldErrors = Object.values(data.erros).join('; ');
      if (fieldErrors) {
        errorMessage = `${errorMessage}: ${fieldErrors}`;
      }
    }
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  // Autenticação
  auth: {
    cadastrar: (dados) => request('/api/auth/cadastrar', { method: 'POST', body: JSON.stringify(dados) }),
    redefinirSenha: (dados) => request('/api/auth/redefinir-senha', { method: 'POST', body: JSON.stringify(dados) }),
    login: async (dados) => {
      const resp = await request('/api/auth/login', { method: 'POST', body: JSON.stringify(dados) });
      setToken(resp.token);
      setCurrentUser({
        id: resp.usuarioId,
        nome: resp.nome,
        email: resp.email,
        role: resp.role,
        fotoUrl: resp.fotoUrl,
        objetivo: resp.objetivo,
      });
      return resp;
    },
    logout: () => {
      setToken(null);
      setCurrentUser(null);
    },
    checkSession: () => {
      const token = getToken();
      if (!token || isTokenExpired(token)) {
        if (token) triggerAutoLogout();
        return false;
      }
      return true;
    }
  },

  // Quadras
  quadras: {
    listar: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.bairro) query.append('bairro', params.bairro);
      const qs = query.toString();
      return request(`/api/quadras${qs ? `?${qs}` : ''}`);
    },
    buscarPorId: (id) => request(`/api/quadras/${id}`),
    criar: (dados) => request('/api/quadras', { method: 'POST', body: JSON.stringify(dados) }),
    sincronizarOsm: () => request('/api/quadras/sincronizar-osm', { method: 'POST' }),
  },

  // Reservas
  reservas: {
    criar: (dados) => request('/api/reservas', { method: 'POST', body: JSON.stringify(dados) }),
    listarMinhas: () => request('/api/reservas/minhas'),
    listarPorQuadra: (quadraId) => request(`/api/reservas/quadra/${quadraId}`),
    cancelar: (id) => request(`/api/reservas/${id}`, { method: 'DELETE' }),
  },

  // Turmas Sociais
  turmas: {
    listarTodas: () => request('/api/turmas'),
    listarPorQuadra: (quadraId) => request(`/api/turmas/quadra/${quadraId}`),
    criar: (dados) => request('/api/turmas', { method: 'POST', body: JSON.stringify(dados) }),
  },

  // Zeladoria
  chamados: {
    listarTodos: () => request('/api/chamados'),
    listarPorQuadra: (quadraId) => request(`/api/chamados/quadra/${quadraId}`),
    listarMeus: () => request('/api/chamados/meus'),
    criar: (formData) => request('/api/chamados', { method: 'POST', body: formData }),
    atualizarStatus: (id, status) => request(`/api/chamados/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  },

  // Perfil de Usuário
  usuarios: {
    obterPerfil: () => request('/api/usuarios/perfil'),
    atualizarPerfil: (dados) => request('/api/usuarios/perfil', { method: 'PUT', body: JSON.stringify(dados) }),
    atualizarFoto: (formData) => request('/api/usuarios/perfil/foto', { method: 'POST', body: formData }),
  },

  // Matchmaking & Partidas Abertas
  partidas: {
    listar: (params = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.append('status', params.status);
      if (params.esporte) query.append('esporte', params.esporte);
      const qs = query.toString();
      return request(`/api/partidas${qs ? `?${qs}` : ''}`);
    },
    buscarPorId: (id) => request(`/api/partidas/${id}`),
    minhas: () => request('/api/partidas/minhas'),
    criar: (dados) => request('/api/partidas', { method: 'POST', body: JSON.stringify(dados) }),
    confirmar: (id, dados) => request(`/api/partidas/${id}/confirmar`, { method: 'POST', body: JSON.stringify(dados) }),
    sair: (id) => request(`/api/partidas/${id}/sair`, { method: 'DELETE' }),
    escolherQuadra: (id, quadraId) => request(`/api/partidas/${id}/escolher-quadra`, {
      method: 'POST',
      body: JSON.stringify({ quadraId })
    }),
    cancelar: (id) => request(`/api/partidas/${id}`, { method: 'DELETE' }),
    listarMensagens: (id) => request(`/api/partidas/${id}/mensagens`),
    enviarMensagem: (id, dados) => request(`/api/partidas/${id}/mensagens`, {
      method: 'POST',
      body: JSON.stringify(dados)
    }),
  },

  // Avaliações, Reputação & Habilidade
  avaliacoes: {
    listarColegas: (partidaId) => request(`/api/avaliacoes/partida/${partidaId}/colegas`),
    enviarAvaliacoes: (partidaId, avaliacoes) => request(`/api/avaliacoes/partida/${partidaId}`, {
      method: 'POST',
      body: JSON.stringify({ avaliacoes })
    }),
    obterReputacao: (usuarioId) => request(`/api/avaliacoes/usuario/${usuarioId}`)
  }
};
