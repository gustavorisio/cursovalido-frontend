import { test } from 'vitest';
import assert from 'node:assert/strict';

test('mensagens orientam login, permissão, termos e correção de campos sem detalhes técnicos', async () => {
  const fetchOriginal = globalThis.fetch;
  try {
    const { requisitar } = await import('/src/servicos/api.js');
    for (const [status, dados, mensagem] of [
      [401, { codigo: 'CREDENCIAIS_INVALIDAS' }, 'E-mail ou senha incorretos. Confira os dados e tente novamente.'],
      [401, { codigo: 'AUTENTICACAO_NECESSARIA' }, 'Entre na sua conta para continuar.'],
      [403, { codigo: 'ACESSO_NEGADO', erro: 'ROLE_ADMIN_REQUIRED' }, 'Você não tem permissão para fazer isso. Se precisar, fale com o Suporte.'],
      [403, { codigo: 'TERMOS_NAO_ACEITOS' }, 'Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.'],
      [400, { codigo: 'CAMPOS_INVALIDOS', erro: 'Dados inválidos', campos: { email: 'Digite um e-mail válido.', titulo: 'Preencha este campo.' } }, 'E-mail: Digite um e-mail válido. Título: Preencha este campo.'],
      [400, { codigo: 'CODIGO_2FA_EXPIRADO' }, 'O código enviado ao seu e-mail venceu. Peça um novo código e tente novamente.'],
      [500, { erro: 'SQLException at jdbc:interno' }, 'O serviço está indisponível no momento. Tente novamente em alguns minutos.'],
    ]) {
      globalThis.fetch = async () => Response.json(dados, { status });
      await assert.rejects(requisitar('/teste', { semAutenticacao: true }), erro => {
        assert.equal(erro.status, status);
        assert.equal(erro.message, mensagem);
        assert.doesNotMatch(erro.message, /ROLE_|SQL|jdbc:/);
        return true;
      });
    }
  } finally { globalThis.fetch = fetchOriginal; }
});