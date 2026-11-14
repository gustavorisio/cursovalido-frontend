import { obterTokenSessao, tokenValido } from './sessaoNavegador';

export const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
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

function mensagemDeErro(status, dados) {
  const codigo = dados?.codigo;
  const erroDeAcesso = ['EMAIL_NAO_CONFIRMADO', 'TERMOS_NAO_ACEITOS'].includes(codigo);

  if (status === 403 && !erroDeAcesso) return 'Você não tem permissão para esta operação.';
  if (status >= 500) return 'O serviço está indisponível. Tente novamente mais tarde.';
  if (status === 429) return 'Limite de tentativas atingido. Aguarde alguns minutos antes de tentar novamente.';
  if (status === 404) return 'O conteúdo solicitado não foi encontrado.';
  if (status === 409) return 'Esta operação entrou em conflito com dados existentes.';
  if (status === 401 && codigo !== 'CREDENCIAIS_INVALIDAS') return 'Sua sessão expirou. Faça login novamente.';
  if (codigo === 'CREDENCIAIS_INVALIDAS') return 'E-mail ou senha incorretos.';
  if (codigo === 'EMAIL_NAO_CONFIRMADO') return 'Seu e-mail ainda não foi confirmado.';
  if (codigo === 'TERMOS_NAO_ACEITOS') return 'É necessário ler e aceitar os termos novamente para acessar a conta.';

  return formatarMensagem(dados) || 'Não foi possível concluir a operação. Tente novamente.';
}

export async function requisitar(caminho, opcoes = {}) {
  const { semAutenticacao = false, tokenAutenticacao, ...opcoesFetch } = opcoes;
  const token = tokenAutenticacao ?? obterTokenSessao();
  const cabecalhos = { Accept: 'application/json', ...opcoesFetch.headers };

  if (opcoesFetch.body || !semAutenticacao) cabecalhos['Content-Type'] = 'application/json';
  if (!semAutenticacao && tokenValido(token)) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, { ...opcoesFetch, headers: cabecalhos });
  } catch {
    if (opcoesFetch.signal?.aborted) {
      throw new ErroApi(0, 'O tempo de espera terminou. Tente novamente em instantes.', { codigo: 'TEMPO_ESGOTADO' });
    }
    throw new ErroApi(0, 'Não foi possível conectar. Verifique sua conexão e tente novamente.', { codigo: 'FALHA_CONEXAO' });
  }

  if (!semAutenticacao && tokenAutenticacao === undefined && obterTokenSessao() !== token) {
    throw new ErroApi(409, 'Sua sessão foi encerrada. Entre novamente.', { codigo: 'SESSAO_ALTERADA' });
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

  if (!resposta.ok) {
    const mensagensServico = {
      LIMITE_SUPORTE_ATINGIDO: 'Já recebemos uma solicitação sua recentemente. Aguarde 24 horas após o último envio para tentar novamente.',
      SUPORTE_INDISPONIVEL: 'O suporte está temporariamente indisponível. Tente novamente mais tarde.',
      SERVICO_EMAIL_INDISPONIVEL: 'Não foi possível enviar o e-mail. Tente novamente em instantes.',
    };
    if (Object.hasOwn(mensagensServico, dados?.codigo)) {
      throw new ErroApi(resposta.status, mensagensServico[dados.codigo], dados);
    }
    const contaExcluida = resposta.status === 409
      && formatarMensagem(dados) === 'E-mail bloqueado por 15 dias apos a exclusao da conta.';
    if (contaExcluida) {
      throw new ErroApi(resposta.status,
        'O e-mail informado está vinculado a uma conta excluída. Por isso, ele fica bloqueado para novos cadastros por 15 dias após a exclusão.', dados);
    }
    if (['EMAIL_JA_CADASTRADO', 'PERFIL_CONVITE_INVALIDO'].includes(dados?.codigo)) {
      throw new ErroApi(resposta.status, formatarMensagem(dados) ?? 'Não foi possível enviar o convite.', dados);
    }
    if (['CONTA_SUSPENSA', 'FORUM_SUSPENSO', 'TOPICOS_SUSPENSOS', 'COMENTARIOS_SUSPENSOS'].includes(dados?.codigo)) {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-restricoes-alteradas'));
      throw new ErroApi(resposta.status, formatarMensagem(dados) ?? 'Há uma restrição ativa na sua conta.', dados);
    }
    if (resposta.status === 403 && !semAutenticacao && dados?.codigo === 'TERMOS_NAO_ACEITOS') {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-termos-pendentes', {
        detail: { token: dados?.token ?? dados?.jwt ?? dados?.accessToken, tokenOrigem: token }
      }));
    }
    if (resposta.status === 401 && !semAutenticacao) {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-sessao-expirada', { detail: { token: token } }));
    }
    const mensagem = mensagemDeErro(resposta.status, dados);
    throw new ErroApi(resposta.status, mensagem, dados);
  }

  return dados?.value ?? dados;
}
