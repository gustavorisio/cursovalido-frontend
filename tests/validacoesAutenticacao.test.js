import { test } from 'vitest';
import assert from 'node:assert/strict';
import { MENSAGEM_SENHA, REGRAS_SENHA, mensagemSenha, problemasSenha, senhaValida } from '../src/servicos/politicaSenha.js';
import { LIMITES, validarCadastro, validarCodigo, validarEmail, validarLogin, validarNome, validarNovaSenha } from '../src/servicos/validacoesAutenticacao.js';

const cadastroValido = {
  nomeCompleto: 'Ana Souza', email: 'ana@example.com', senha: 'Senha@12', confirmacaoSenha: 'Senha@12',
  declarouMaiorIdade: true, versaoTermos: '1.0', aceitouTermosLgpd: true,
};

test('senha sem caractere especial informa exatamente a regra que falta', () => {
  assert.equal(mensagemSenha('SenhaForte1'), 'A senha deve ter pelo menos um caractere especial, como ! ou @.');
  assert.deepEqual(problemasSenha('senha'), [
    'A senha deve ter pelo menos 8 caracteres.',
    'A senha deve ter pelo menos uma letra maiúscula.',
    'A senha deve ter pelo menos um caractere especial, como ! ou @.',
  ]);
  assert.equal(mensagemSenha('SENHA123!'), 'A senha deve ter pelo menos uma letra minúscula.');
  assert.equal(mensagemSenha('Aa!' + 'a'.repeat(70)), 'A senha deve ter no máximo 72 bytes em UTF-8. Use uma senha mais curta.');
  assert.equal(mensagemSenha('Senha@12'), '');
  assert.equal(senhaValida(), false);
  assert.equal(REGRAS_SENHA.length, 5);
  assert.match(MENSAGEM_SENHA, /72 bytes em UTF-8/);
});

test('limites seguem os do servidor', () => {
  assert.deepEqual(LIMITES, { nome: 120, email: 254, senha: 72, codigo: 6 });
  assert.equal(validarNome('A'.repeat(121)), 'O nome deve ter no máximo 120 caracteres.');
  assert.equal(validarNome('   '), 'Informe seu nome completo.');
  assert.equal(validarNome('Ana'), '');
  assert.equal(validarEmail(''), 'Informe seu e-mail.');
  assert.match(validarEmail('ana@'), /e-mail válido/);
  assert.equal(validarEmail('a'.repeat(250) + '@x.com'), 'O e-mail deve ter no máximo 254 caracteres.');
  assert.equal(validarEmail(' ana@example.com '), '');
});

test('login e código de verificação são conferidos antes do envio', () => {
  assert.equal(validarLogin('', 'x'), 'Informe seu e-mail.');
  assert.equal(validarLogin('ana@example.com', ''), 'Informe sua senha.');
  assert.equal(validarLogin('ana@example.com', 'á'.repeat(37)), 'A senha deve ter no máximo 72 bytes em UTF-8.');
  assert.equal(validarLogin('ana@example.com', 'qualquer'), '');
  assert.equal(validarCodigo(''), 'Informe o código enviado ao seu e-mail.');
  assert.equal(validarCodigo('12a456'), 'O código deve ter exatamente 6 números.');
  assert.equal(validarCodigo('1234567'), 'O código deve ter exatamente 6 números.');
  assert.equal(validarCodigo(' 012345 '), '');
});

test('nova senha verifica política antes da confirmação', () => {
  assert.equal(validarNovaSenha('', ''), 'Informe uma senha.');
  assert.equal(validarNovaSenha('', '', { rotulo: 'a nova senha' }), 'Informe a nova senha.');
  assert.equal(validarNovaSenha('Senha1', 'Senha1'), 'A senha deve ter pelo menos 8 caracteres.');
  assert.equal(validarNovaSenha('Senha@12', ''), 'Confirme a senha.');
  assert.equal(validarNovaSenha('Senha@12', 'Senha@13'), 'A confirmação deve ser igual à senha.');
  assert.equal(validarNovaSenha('Senha@12', 'Senha@12'), '');
});

test('cadastro aponta o primeiro problema na ordem dos campos', () => {
  assert.equal(validarCadastro(cadastroValido), '');
  const casos = [
    [{ nomeCompleto: '' }, 'Informe seu nome completo.'],
    [{ email: 'invalido' }, /e-mail válido/],
    [{ senha: 'Senha1', confirmacaoSenha: 'Senha1' }, /pelo menos 8 caracteres/],
    [{ confirmacaoSenha: 'Outra@1' }, 'A confirmação deve ser igual à senha.'],
    [{ declarouMaiorIdade: false }, 'Confirme que você tem 18 anos ou mais.'],
    [{ versaoTermos: '' }, /documentos ainda não foi carregada/],
    [{ aceitouTermosLgpd: false }, /Aceite os Termos/],
  ];
  for (const [alteracao, esperado] of casos) {
    const resultado = validarCadastro({ ...cadastroValido, ...alteracao });
    if (esperado instanceof RegExp) assert.match(resultado, esperado);
    else assert.equal(resultado, esperado);
  }
});
