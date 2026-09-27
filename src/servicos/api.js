export const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const URL_BACKEND = URL_API.replace(/\/api\/?$/, '');

export class ErroApi extends Error {
  constructor(status, mensagem, dados = null) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = dados?.codigo;
    this.dados = dados;
  }
}

function tokenValido(token) {
  if (typeof token !== 'string' || token.split('.').length !== 3) return false;
  try {
    const partePayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadComPadding = partePayload.padEnd(Math.ceil(partePayload.length / 4) * 4, '=');
    const dados = JSON.parse(atob(payloadComPadding));
    return !dados.exp || dados.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function formatarMensagem(dados) {
  const mensagem = dados?.erro || dados?.message || dados?.mensagem || dados?.errors || dados?.erros;
  if (typeof mensagem === 'string') return mensagem;
  function texto(valor, campo = '') {
    if (typeof valor === 'string') return campo ? `${campo}: ${valor}` : valor;
    if (Array.isArray(valor)) return valor.map((item) => texto(item, campo)).filter(Boolean).join(' ');
    if (valor && typeof valor === 'object') {
      return Object.entries(valor).map(([nome, item]) => texto(item, nome)).filter(Boolean).join(' ');
    }
    return '';
  }
  const resultado = texto(mensagem);
  return resultado || null;
}

export async function requisitar(caminho, opcoes = {}) {
  const { semAutenticacao = false, tokenAutenticacao, ...opcoesFetch } = opcoes;
  const token = tokenAutenticacao || sessionStorage.getItem('token');
  const cabecalhos = { Accept: 'application/json', ...opcoesFetch.headers };

  if (opcoesFetch.body || !semAutenticacao) cabecalhos['Content-Type'] = 'application/json';
  const tokenParaEnviar = tokenAutenticacao || token;
  if (!semAutenticacao && tokenValido(tokenParaEnviar)) cabecalhos.Authorization = `Bearer ${tokenParaEnviar}`;

  let resposta;
  const detalhesRequisicao = {
    method: opcoesFetch.method || 'GET',
    url: `${URL_API}${caminho}`,
    temAuthorization: Boolean(cabecalhos.Authorization)
  };
  if (import.meta.env.DEV) console.debug('[API] request', detalhesRequisicao);
  try {
    resposta = await fetch(`${URL_API}${caminho}`, { ...opcoesFetch, headers: cabecalhos });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor.');
  }

  const texto = await resposta.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (import.meta.env.DEV) {
    console.debug('[API] response', { ...detalhesRequisicao, status: resposta.status, body: dados });
  }

  if (!resposta.ok) {
    if (resposta.status === 403 && !semAutenticacao && dados?.codigo === 'TERMOS_NAO_ACEITOS') {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-termos-pendentes', {
        detail: { token: dados?.token || dados?.jwt || dados?.accessToken }
      }));
    }
    if (resposta.status === 401 && !semAutenticacao) {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-sessao-expirada'));
    }
    const mensagem = (resposta.status === 403 && !['EMAIL_NAO_CONFIRMADO', 'TERMOS_NAO_ACEITOS'].includes(dados?.codigo)
      ? 'Você não tem permissão para esta operação.'
      : resposta.status >= 500
        ? 'O servidor está indisponível no momento. Tente novamente mais tarde.'
        : resposta.status === 429
          ? 'Limite de tentativas atingido. Aguarde alguns minutos antes de tentar novamente.'
          : resposta.status === 404
            ? 'O recurso solicitado não foi encontrado.'
            : resposta.status === 409
              ? 'Esta operação entrou em conflito com dados existentes.'
              : resposta.status === 401 && dados?.codigo !== 'CREDENCIAIS_INVALIDAS'
                ? 'Sua sessão expirou. Faça login novamente.'
                : resposta.status === 403 && !['EMAIL_NAO_CONFIRMADO', 'TERMOS_NAO_ACEITOS'].includes(dados?.codigo)
                  ? 'Você não tem permissão para esta operação.'
                  : dados?.codigo === 'CREDENCIAIS_INVALIDAS'
                    ? 'E-mail ou senha incorretos.'
                    : dados?.codigo === 'EMAIL_NAO_CONFIRMADO'
                      ? 'Seu e-mail ainda não foi confirmado.'
                      : dados?.codigo === 'TERMOS_NAO_ACEITOS'
                        ? 'É necessário ler e aceitar os termos novamente para acessar a conta.'
                        : null)
      || formatarMensagem(dados)
      || (resposta.status === 401 ? 'Sua sessão expirou. Faça login novamente.' : null)
      || (resposta.status === 403 ? 'Você não tem permissão para esta operação.' : null)
      || `O servidor respondeu com o status ${resposta.status}.`;
    throw new ErroApi(resposta.status, mensagem, dados);
  }

  return dados?.value ?? dados;
}
