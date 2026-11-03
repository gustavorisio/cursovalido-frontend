import test from 'node:test';
import assert from 'node:assert/strict';
import { criarFilaProgresso } from '../src/componentes/aulas/servicos/filaProgresso.js';
import { carregarYoutube, mensagemErroPlayer } from '../src/componentes/aulas/servicos/youtubePlayer.js';

test('posição, conclusão e retorno a uma posição anterior são enviados em sequência', async () => {
  const executar = criarFilaProgresso();
  const chamadas = [];
  let liberar;
  const espera = new Promise((resolve) => { liberar = resolve; });
  const primeira = executar(async () => {
    chamadas.push(120);
    await espera;
  });
  const conclusao = executar(() => chamadas.push('concluir'));
  const retorno = executar(() => chamadas.push(30));
  await Promise.resolve();
  assert.deepEqual(chamadas, [120]);
  liberar();
  await Promise.all([primeira, conclusao, retorno]);
  assert.deepEqual(chamadas, [120, 'concluir', 30]);
});

test('uma falha de rede não bloqueia novos salvamentos', async () => {
  const executar = criarFilaProgresso();
  await assert.rejects(executar(() => { throw new Error('Sem conexão'); }), /Sem conexão/);
  assert.equal(await executar(() => 15), 15);
});

test('carregamento do YouTube compartilha script, permite retry e reutiliza API pronta', async () => {
  const scripts = [];
  const temporizadores = new Map();
  let proximoTimer = 0;
  globalThis.window = {
    setTimeout: (callback) => { temporizadores.set(++proximoTimer, callback); return proximoTimer; },
    clearTimeout: (id) => temporizadores.delete(id),
  };
  globalThis.document = {
    createElement: () => ({ remove() { this.removido = true; } }),
    head: { appendChild: (script) => scripts.push(script) },
  };
  try {
    const primeira = carregarYoutube();
    assert.equal(carregarYoutube(), primeira);
    assert.equal(scripts.length, 1);
    const rejeicao = assert.rejects(primeira, /Não foi possível carregar/);
    scripts[0].onerror();
    await rejeicao;
    assert.equal(scripts[0].removido, true);

    const segunda = carregarYoutube();
    assert.equal(scripts.length, 2);
    const timeout = assert.rejects(segunda, /Não foi possível carregar/);
    [...temporizadores.values()][0]();
    await timeout;

    const terceira = carregarYoutube();
    window.YT = { Player: function Player() {} };
    window.onYouTubeIframeAPIReady();
    assert.equal(await terceira, window.YT);
    assert.equal(await carregarYoutube(), window.YT);
    assert.equal(scripts.length, 3);
    assert.equal(temporizadores.size, 0);
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test('erros do player cobrem vídeo ausente, incorporação bloqueada e identificação do site', () => {
  assert.match(mensagemErroPlayer(100), /removido/);
  assert.match(mensagemErroPlayer(101), /bloqueou/);
  assert.equal(mensagemErroPlayer(101), mensagemErroPlayer(150));
  assert.match(mensagemErroPlayer(153), /identificar o site/);
  assert.match(mensagemErroPlayer(2), /inválido/);
  assert.match(mensagemErroPlayer(5), /Não foi possível reproduzir/);
});
