import { requisitar } from './api';

export function cadastrarUsuario(dados) {
  const { nomeCompleto, email, senha, cpf, dataNascimento, telefone,
    cep, logradouro, bairro, cidade, estado, declarouMaiorIdade,
    aceitouTermosLgpd, versaoTermos } = dados;
  return requisitar('/autenticacao/cadastro', {
    method: 'POST',
    semAutenticacao: true,
    body: JSON.stringify({
      nomeCompleto,
      email,
      senha,
      cpf,
      dataNascimento,
      telefone,
      endereco: { cep, logradouro, bairro, cidade, estado },
      declarouMaiorIdade,
      aceitouTermosLgpd,
      versaoTermos
    })
  });
}

export function consultarEndereco(cep) {
  return requisitar(`/enderecos/consultar/${cep}`, { semAutenticacao: true });
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

export function excluirConta() {
  return requisitar('/autenticacao/conta', { method: 'DELETE' });
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
  const { nomeCompleto, email, senha, cpf, dataNascimento, telefone,
    cep, logradouro, bairro, cidade, estado, declarouMaiorIdade,
    aceitouTermosLgpd, versaoTermos } = cadastro;
  return requisitar('/convites/completar-cadastro', {
    method: 'POST', semAutenticacao: true, body: JSON.stringify({
      token,
      cadastro: {
        nomeCompleto,
        email,
        senha,
        cpf,
        dataNascimento,
        telefone,
        endereco: { cep, logradouro, bairro, cidade, estado },
        declarouMaiorIdade,
        aceitouTermosLgpd,
        versaoTermos
      }
    })
  });
}
