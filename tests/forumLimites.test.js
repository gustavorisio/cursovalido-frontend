import { test } from 'vitest';
import assert from 'node:assert/strict';

test('fórum impede envio acima do limite ao criar e editar tópicos e comentários', async () => {
  const fetchOriginal = globalThis.fetch;
  let chamadas = 0;
  globalThis.fetch = async () => { chamadas++; return new Response('{}'); };
  try {
    const servico = await import('/src/componentes/forum/servicos/servicoForum.js');
    const titulo = 't'.repeat(81);
    const longo = 'a'.repeat(5001);
    for (const executar of [
      () => servico.criarTopico({ titulo, descricao: 'Descrição' }),
      () => servico.atualizarTopico(1, { titulo, descricao: 'Descrição' }),
      () => servico.criarTopico({ titulo: 'Título', descricao: longo }),
      () => servico.atualizarTopico(1, { titulo: 'Título', descricao: longo }),
      () => servico.criarComentario(1, longo),
      () => servico.atualizarComentario(1, { conteudo: longo }),
    ]) assert.throws(executar, /pode ter até (80|5\.000) caracteres/);
    assert.equal(chamadas, 0);
    await servico.criarTopico({ titulo: 't'.repeat(80), descricao: 'a'.repeat(5000) });
    await servico.criarComentario(1, 'a'.repeat(5000));
    assert.equal(chamadas, 2);
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});
