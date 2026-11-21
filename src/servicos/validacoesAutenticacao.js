import { mensagemSenha } from './politicaSenha';

// Limites iguais aos do backend (CadastroUsuarioRequest, LoginRequest e Codigo2faRequest).
export const LIMITES = { nome: 120, email: 254, senha: 72, codigo: 6 };

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(email) {
  const valor = (email ?? '').trim();
  if (!valor) return 'Informe seu e-mail.';
  if (valor.length > LIMITES.email) return `O e-mail deve ter no máximo ${LIMITES.email} caracteres.`;
  if (!EMAIL_VALIDO.test(valor)) return 'Digite um e-mail válido, como nome@exemplo.com.';
  return '';
}

export function validarNome(nome) {
  const valor = (nome ?? '').trim();
  if (!valor) return 'Informe seu nome completo.';
  if (valor.length > LIMITES.nome) return `O nome deve ter no máximo ${LIMITES.nome} caracteres.`;
  if (!/\p{L}/u.test(valor)) return 'Informe um nome com letras.';
  return '';
}

export function validarNovaSenha(senha, confirmacao, { rotulo = 'uma senha', rotuloConfirmacao = 'Confirme a senha.' } = {}) {
  if (!senha) return `Informe ${rotulo}.`;
  const problema = mensagemSenha(senha);
  if (problema) return problema;
  if (!confirmacao) return rotuloConfirmacao;
  if (senha !== confirmacao) return 'A confirmação deve ser igual à senha.';
  return '';
}

export function validarLogin(email, senha) {
  const erroEmail = validarEmail(email);
  if (erroEmail) return erroEmail;
  if (!senha) return 'Informe sua senha.';
  if (new TextEncoder().encode(senha).length > LIMITES.senha) return 'A senha deve ter no máximo 72 bytes em UTF-8.';
  return '';
}

export function validarCodigo(codigo) {
  const valor = (codigo ?? '').trim();
  if (!valor) return 'Informe o código enviado ao seu e-mail.';
  if (!/^\d{6}$/.test(valor)) return 'O código deve ter exatamente 6 números.';
  return '';
}

// Retorna o primeiro problema do cadastro, na ordem dos campos da tela.
export function validarCadastro(dados) {
  const erroNome = validarNome(dados.nomeCompleto);
  if (erroNome) return erroNome;
  const erroEmail = validarEmail(dados.email);
  if (erroEmail) return erroEmail;
  const erroSenha = validarNovaSenha(dados.senha, dados.confirmacaoSenha);
  if (erroSenha) return erroSenha;
  if (!dados.declarouMaiorIdade) return 'Confirme que você tem 18 anos ou mais.';
  if (!dados.versaoTermos) return 'A versão atual dos documentos ainda não foi carregada.';
  if (!dados.aceitouTermosLgpd) return 'Aceite os Termos de Uso e a Política de Privacidade para continuar.';
  return '';
}
