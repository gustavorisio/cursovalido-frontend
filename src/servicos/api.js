import { obterTokenSessao, tokenValido } from './sessaoNavegador';

export const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
export const URL_BACKEND = URL_API.replace(/\/api\/?$/, '');

export class ErroApi extends Error {
  constructor(status, mensagem, dados = null) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = dados?.codigo;
    this.dados = status >= 500 ? { codigo: dados?.codigo } : dados;
  }
}

const NOMES_CAMPOS = {
  nomeCompleto: 'Nome completo', email: 'E-mail', senha: 'Senha', senhaAtual: 'Senha atual',
  novaSenha: 'Nova senha', confirmacaoSenha: 'Confirmação da senha', dataNascimento: 'Data de nascimento',
  declarouMaiorIdade: 'Confirmação de maioridade', aceitouTermosLgpd: 'Aceite dos documentos',
  aceitouResponsabilidade: 'Termo de responsabilidade', versaoTermos: 'Termos de Uso',
  titulo: 'Título', descricao: 'Descrição', conteudo: 'Texto', codigo: 'Código enviado por e-mail',
  codigo2fa: 'Código enviado por e-mail', emailConta: 'E-mail da conta', usuario: 'Nome de usuário',
  assunto: 'Assunto', motivo: 'Motivo', nome: 'Nome', ordem: 'Ordem', youtubeUrl: 'Link do vídeo',
};

function formatarMensagem(dados) {
  if (dados?.campos && typeof dados.campos === 'object') {
    const campos = Object.entries(dados.campos).map(([campo, mensagem]) => {
      const nome = NOMES_CAMPOS[campo.split('.').at(-1)] ?? 'Campo do formulário';
      return `${nome}: ${mensagem}`;
    });
    if (campos.length) return campos.join(' ');
  }
  const mensagem = dados?.erro || dados?.message || dados?.mensagem;
  return typeof mensagem === 'string' && mensagem.trim() ? mensagem : null;
}

function mensagemDeErro(status, dados) {
  const mensagens = {
    CREDENCIAIS_INVALIDAS: 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
    EMAIL_NAO_CONFIRMADO: 'Confirme seu e-mail para entrar. Abra a mensagem de confirmação ou peça um novo envio.',
    TERMOS_NAO_ACEITOS: 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.',
    TERMOS_REAUTENTICACAO: 'Revise os novos termos e entre novamente para continuar.',
    TERMOS_ATUALIZADOS: 'Os termos foram atualizados. Recarregue a página e aceite os documentos novamente.',
    PENDENTE_APROVACAO: 'Seu cadastro está aguardando aprovação. Aguarde a liberação do administrador.',
    ACESSO_REJEITADO: 'Seu cadastro não foi aprovado. Entre em contato pelo Suporte para pedir uma revisão.',
    ACESSO_NEGADO: 'Você não tem permissão para fazer isso. Se precisar, fale com o Suporte.',
    AUTENTICACAO_NECESSARIA: 'Entre na sua conta para continuar.',
    SESSAO_INVALIDA: 'Seu acesso não é mais válido. Entre na sua conta novamente.',
    CODIGO_2FA_EXPIRADO: 'O código enviado ao seu e-mail venceu. Peça um novo código e tente novamente.',
    JSON_INVALIDO: 'Não foi possível enviar os dados. Confira os campos e tente novamente.',
    PARAMETRO_INVALIDO: 'Faltam informações ou há dados inválidos. Volte à página anterior e tente novamente.',
    EMAIL_JA_CADASTRADO: 'Este e-mail já está cadastrado. Entre na sua conta ou recupere sua senha.',
  };
  if (Object.hasOwn(mensagens, dados?.codigo)) return mensagens[dados.codigo];
  if (status >= 500) return 'O serviço está indisponível no momento. Tente novamente em alguns minutos.';
  if (status === 429) {
    return (dados?.codigo === 'OPERACAO_RECUSADA' && formatarMensagem(dados))
      || 'Você fez muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (status === 401) return 'Sua sessão terminou. Entre na sua conta novamente.';
  if (status === 403) return dados?.codigo === 'OPERACAO_RECUSADA' && formatarMensagem(dados)
    ? formatarMensagem(dados) : 'Você não tem permissão para fazer isso. Se precisar, fale com o Suporte.';
  if (status === 404) return 'Este conteúdo não foi encontrado ou foi removido. Atualize a página para continuar.';
  if (status === 409) return 'Os dados já existem ou foram alterados. Atualize a página e tente novamente.';
  return formatarMensagem(dados) || 'Confira os dados informados e tente novamente.';
}

export async function requisitar(caminho, opcoes = {}) {
  const { semAutenticacao = false, tokenAutenticacao, ...opcoesFetch } = opcoes;
  const token = tokenAutenticacao ?? obterTokenSessao();
  const cabecalhos = { Accept: 'application/json', ...opcoesFetch.headers };

  if (opcoesFetch.body || !semAutenticacao) cabecalhos['Content-Type'] = 'application/json';
  if (!semAutenticacao && tokenValido(token)) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      ...opcoesFetch,
      headers: cabecalhos,
      credentials: 'omit',
      cache: semAutenticacao ? opcoesFetch.cache : 'no-store',
    });
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
    if (['EMAIL_JA_CADASTRADO', 'PERFIL_CONVITE_INVALIDO'].includes(dados?.codigo)) {
      throw new ErroApi(resposta.status, formatarMensagem(dados) ?? 'Não foi possível enviar o convite.', dados);
    }
    if (['CONTA_SUSPENSA', 'FORUM_SUSPENSO', 'TOPICOS_SUSPENSOS', 'COMENTARIOS_SUSPENSOS'].includes(dados?.codigo)) {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-restricoes-alteradas'));
      throw new ErroApi(resposta.status, formatarMensagem(dados) ?? 'Há uma restrição ativa na sua conta.', dados);
    }
    if (resposta.status === 403 && !semAutenticacao && token && tokenAutenticacao === undefined
        && dados?.codigo === 'TERMOS_REAUTENTICACAO' && obterTokenSessao() === token) {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-termos-atualizados'));
    }
    if (resposta.status === 401 && !semAutenticacao) {
      globalThis.dispatchEvent?.(new CustomEvent('curso-valido-sessao-expirada', { detail: { token: token } }));
    }
    const mensagem = mensagemDeErro(resposta.status, dados);
    throw new ErroApi(resposta.status, mensagem, dados);
  }

  return dados?.value ?? dados;
}
