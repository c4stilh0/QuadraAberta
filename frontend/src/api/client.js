const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function getToken() {
  return localStorage.getItem('quadraaberta_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('quadraaberta_token', token);
  } else {
    localStorage.removeItem('quadraaberta_token');
  }
}

export function getCurrentUser() {
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

  const token = getToken();
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

  const response = await fetch(url, config);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.detail || data?.title || 'Ocorreu um erro ao processar a requisição.';
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  // Autenticação
  auth: {
    cadastrar: (dados) => request('/api/auth/cadastrar', { method: 'POST', body: JSON.stringify(dados) }),
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
