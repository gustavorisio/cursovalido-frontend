import { requisitar } from './api';

export function cadastrarUsuario(dados) {
  const { nomeCompleto, email, senha, dataNascimento,
    declarouMaiorIdade,
    aceitouTermosLgpd, versaoTermos } = dados;
  return requisitar('/autenticacao/cadastro', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({
      nomeCompleto,
      email,
      senha,
      dataNascimento,

      declarouMaiorIdade,
      aceitouTermosLgpd,
      versaoTermos
    })
  });
}


export function buscarPoliticasAtivas() {
  return requisitar('/politicas/ativas', { semAutenticacao: true });
}

export async function buscarPoliticaAtiva() {
  const resposta = await buscarPoliticasAtivas();
  const politica = Array.isArray(resposta) ? resposta[0] : resposta;
  if (!politica?.versao || !politica?.conteudo) {
    const erro = new Error('Os documentos legais estão indisponíveis ou não possuem uma versão ativa.');
    erro.codigo = 'POLITICA_INDISPONIVEL';
    throw erro;
  }
  return politica;
}

export function publicarPolitica(nome, versao, conteudo) {
  return requisitar('/politicas', {
    method: 'POST',
    body: JSON.stringify({ nome, versao, conteudo })
  });
}

export function buscarPrivacidadeAtiva() {
  return requisitar('/politicas/privacidade/ativa', { semAutenticacao: true });
}

export function publicarPrivacidade(nome, versao, conteudo) {
  return requisitar('/politicas/privacidade', {
    method: 'POST',
    body: JSON.stringify({ nome, versao, conteudo }),
  });
}

export function confirmarEmail(token) {
  return requisitar('/autenticacao/confirmar-email', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({ token })
  });
}

export function confirmarCodigo2fa(email, codigo) {
  return requisitar('/autenticacao/confirmar-2fa', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({ email, codigo })
  });
}

export function reenviarCodigo2fa(email) {
  return requisitar('/autenticacao/reenviar-2fa', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({ email })
  });
}

export function reenviarConfirmacao(email) {
  return requisitar('/autenticacao/reenviar-confirmacao', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({ email })
  });
}

export function solicitarAlteracaoSenha(email) {
  return requisitar('/autenticacao/solicitar-alteracao-senha', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({ email })
  });
}

export function alterarSenha(token, novaSenha, confirmacaoSenha) {
  return requisitar('/autenticacao/alterar-senha', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({ token, novaSenha, confirmacaoSenha })
  });
}

export function revogarTermos() {
  return requisitar('/autenticacao/revogar-termos', { method: 'POST' });
}

export function aceitarTermosNovamente(token, versaoTermos) {
  return requisitar('/autenticacao/aceitar-termos-novamente', {
    method: 'POST',
    tokenAutenticacao: token,
    body: JSON.stringify({ versaoTermos })
  });
}

export function solicitarExclusaoConta() {
  return requisitar('/autenticacao/conta/solicitar-exclusao', { method: 'POST' });
}

export function excluirConta(codigo) {
  if (typeof codigo !== 'string' || !/^[0-9]{6}$/.test(codigo)) {
    throw new Error('Informe o código de seis dígitos enviado ao seu e-mail.');
  }
  return requisitar('/autenticacao/conta', { method: 'DELETE', body: JSON.stringify({ codigo }) });
}

export function criarConvite(email, perfil) {
  return requisitar('/administracao/convites', { method: 'POST', body: JSON.stringify({ email, perfil }) });
}

export function buscarConvites() {
  return requisitar('/administracao/convites');
}

export function buscarConvitesPendentes() {
  return requisitar('/administracao/convites/pendentes');
}

export function aprovarConvite(id) {
  return requisitar(`/administracao/convites/${id}/aprovar`, { method: 'POST' });
}

export function rejeitarConvite(id) {
  return requisitar(`/administracao/convites/${id}/rejeitar`, { method: 'POST' });
}

export function removerPendenciaConvite(id) {
  return requisitar(`/administracao/convites/${id}`, { method: 'DELETE' });
}

export function cancelarConvite(id) {
  return requisitar(`/administracao/convites/${id}/cancelar`, { method: 'DELETE' });
}

export function reenviarConvite(id) {
  return requisitar(`/administracao/convites/${id}/reenviar`, { method: 'POST' });
}

export function confirmarEmailConvite(token) {
  return requisitar('/convites/confirmar-email', {
    method: 'POST', semAutenticacao: true, body: JSON.stringify({ token })
  });
}

export function completarCadastroConvite(token, cadastro) {
  const { nomeCompleto, email, senha, dataNascimento,
    declarouMaiorIdade,
    aceitouTermosLgpd, versaoTermos } = cadastro;
  return requisitar('/convites/completar-cadastro', {
    method: 'POST', semAutenticacao: true, body: JSON.stringify({
      token,
      cadastro: {
        nomeCompleto,
        email,
        senha,
        dataNascimento,

        declarouMaiorIdade,
        aceitouTermosLgpd,
        versaoTermos
      }
    })
  });
}

export async function buscarMeusDados() {
  const dados = await requisitar('/autenticacao/meus-dados', { cache: 'no-store' });
  if (!dados || Array.isArray(dados) || !dados.id || !dados.email || !dados.nomeCompleto) {
    throw new Error('Não foi possível carregar seus dados pessoais. Tente novamente.');
  }
  return dados;
}

export async function baixarDadosPessoais() {
  const dados = await requisitar('/autenticacao/exportar-dados', { cache: 'no-store' });
  if (!dados?.id || !dados.email) throw new Error('Não foi possível exportar seus dados pessoais.');
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'meus-dados-pessoais.json';
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export function alterarSenhaAutenticado({ senhaAtual, novaSenha, confirmacaoSenha }) {
  return requisitar('/autenticacao/alterar-senha-autenticado', {
    method: 'POST', body: JSON.stringify({ senhaAtual, novaSenha, confirmacaoSenha })
  });
}
