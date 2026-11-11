import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('fórum impede envio acima do limite ao criar e editar tópicos e comentários', async () => {
  const servidor = await createServer({ configFile: false, server: { middlewareMode: true }, logLevel: 'silent' });
  const fetchOriginal = globalThis.fetch;
  let chamadas = 0;
  globalThis.fetch = async () => { chamadas++; return new Response('{}'); };
  try {
    const servico = await servidor.ssrLoadModule('/src/componentes/forum/servicos/servicoForum.js');
    const titulo = 't'.repeat(256);
    const longo = 'a'.repeat(5001);
    for (const executar of [
      () => servico.criarTopico({ titulo, descricao: 'Descrição' }),
      () => servico.atualizarTopico(1, { titulo, descricao: 'Descrição' }),
      () => servico.criarTopico({ titulo: 'Título', descricao: longo }),
      () => servico.atualizarTopico(1, { titulo: 'Título', descricao: longo }),
      () => servico.criarComentario(1, longo),
      () => servico.atualizarComentario(1, { conteudo: longo }),
    ]) assert.throws(executar, /Limite máximo alcançado/);
    assert.equal(chamadas, 0);
    await servico.criarTopico({ titulo: 't'.repeat(255), descricao: 'a'.repeat(5000) });
    await servico.criarComentario(1, 'a'.repeat(5000));
    assert.equal(chamadas, 2);
  } finally {
    globalThis.fetch = fetchOriginal;
    await servidor.close();
  }
});
