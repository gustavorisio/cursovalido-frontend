import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { act } from 'react';
import { prepararTela, botao, clicar, preencher, simularApi } from './apoio/tela.js';

let Catalogo, Aula;
const { renderizar } = prepararTela(async (carregar) => {
  Catalogo = (await carregar('componentes/aulas/PaginaCatalogo.jsx')).default;
  Aula = (await carregar('componentes/aulas/PaginaAulaAluno.jsx')).default;
});

const sessao = { perfil: 'ALUNO', idUsuario: 3 };
const curso = { id: 1, titulo: 'Programação Web', descricao: 'Interfaces com React', idTema: 4 };
const modulo = { id: 2, titulo: 'Fundamentos' };
const aula = { id: 3, idModulo: 2, titulo: 'Primeira aula', youtubeVideoId: 'abcdefghijk', ordem: 1 };

test('aluno filtra o catálogo, faz matrícula e acessa o curso matriculado', async () => {
  let tentativas = 0;
  const chamadas = simularApi(({ rota, metodo }) => {
    if (rota === '/aluno/cursos') return Response.json([curso]);
    if (rota === '/aluno/matriculas') return Response.json([]);
    if (rota === '/catalogo/temas') return Response.json([{ id: 4, nome: 'Web' }, { id: 5, nome: 'Dados' }]);
    if (rota === '/aluno/cursos/1/matriculas' && metodo === 'POST') {
      tentativas++;
      return tentativas === 1 ? Response.json({}, { status: 503 }) : Response.json({ idCurso: 1 });
    }
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Catalogo, { sessao });

  await clicar('Minhas matrículas');
  assert.match(document.querySelector('.empty-list').textContent, /ainda não possui matrículas/);
  await clicar('Ver todos os cursos');
  await preencher('input[type="search"]', 'curso inexistente');
  assert.match(document.querySelector('.empty-list').textContent, /Nenhum curso encontrado/);
  await clicar('Ver todos os cursos');
  await preencher('select', '5');
  assert.equal(document.querySelectorAll('article').length, 0);
  await clicar('Limpar tema');

  await clicar('Matricular-se gratuitamente');
  assert.ok(document.querySelector('[role="alert"]'));
  await clicar('Matricular-se gratuitamente');
  assert.match(document.querySelector('.mensagem-sucesso').textContent, /Matrícula/);
  assert.equal(chamadas.filter(({ metodo }) => metodo === 'POST').length, 2);
  await clicar('Minhas matrículas');
  assert.equal(document.querySelector('article a[href="/aluno/cursos/1"]').textContent, 'Acessar curso');
});

test('aula retoma o vídeo, salva a posição e permite marcar a conclusão', async () => {
  let opcoesPlayer;
  let segundos = 10;
  let falhar = true;
  const iframe = document.createElement('iframe');
  const destruir = vi.fn();
  window.YT = {
    Player: class {
      constructor(_elemento, opcoes) { opcoesPlayer = opcoes; }
      getCurrentTime() { return segundos; }
      destroy() { destruir(); }
    },
    PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
  };

  const chamadas = simularApi(({ rota, metodo, dados }) => {
    if (rota === '/aluno/cursos/1') return Response.json(curso);
    if (rota === '/aluno/cursos/1/modulos') return Response.json([modulo]);
    if (rota === '/aluno/aulas/3') return Response.json(aula);
    if (rota === '/aluno/modulos/2/aulas') return Response.json([aula]);
    if (rota === '/aluno/aulas/3/progresso') {
      if (metodo === 'GET') return Response.json({ posicaoSegundos: 10, concluida: false });
      if (falhar) {
        falhar = false;
        return Response.json({}, { status: 503 });
      }
      return Response.json({ posicaoSegundos: dados.posicaoSegundos, concluida: false });
    }
    if (rota === '/aluno/aulas/3/conclusao') return Response.json({ posicaoSegundos: 42, concluida: true });
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Aula, { sessao, url: '/aluno/cursos/1/aulas/3', rota: '/aluno/cursos/:idCurso/aulas/:idAula' });
  assert.equal(opcoesPlayer.playerVars.start, 10);
  assert.equal(opcoesPlayer.videoId, aula.youtubeVideoId);
  await act(async () => opcoesPlayer.events.onReady({ target: { getIframe: () => iframe } }));
  assert.equal(iframe.title, 'Vídeo da aula');

  segundos = 42.5;
  await act(async () => {
    opcoesPlayer.events.onStateChange({ data: window.YT.PlayerState.PLAYING });
    opcoesPlayer.events.onStateChange({ data: window.YT.PlayerState.PAUSED });
  });
  assert.match(document.querySelector('[role="alert"]').textContent, /Não foi possível salvar a posição/);
  await act(async () => opcoesPlayer.events.onStateChange({ data: window.YT.PlayerState.PAUSED }));
  assert.deepEqual(chamadas.filter(({ metodo }) => metodo === 'PUT').map(({ dados }) => dados), [
    { posicaoSegundos: 42 }, { posicaoSegundos: 42 },
  ]);
  assert.doesNotMatch(document.body.textContent, /Última posição salva/);

  await clicar('Marcar como concluída');
  assert.equal(chamadas.at(-1).rota, '/aluno/aulas/3/conclusao');
  assert.equal(botao('Aula concluída').disabled, true);
  assert.equal(destruir.mock.calls.length, 0);
});
