import { test } from 'vitest';
import assert from 'node:assert/strict';
import { prepararTela, clicar, simularApi } from './apoio/tela.js';

let Ranking, Tabela;
const { renderizar } = prepararTela(async (carregar) => {
  Ranking = (await carregar('paginas/RankingAlunos.jsx')).default;
  Tabela = (await carregar('componentes/aulas/componentes/TabelaRankingAlunos.jsx')).default;
});

test('ranking pagina os alunos preservando posição, nome e indicadores', async () => {
  const alunos = Array.from({ length: 11 }, (_, indice) => ({ posicao: indice + 1, nome: `Aluno ${indice + 1}`,
    nivel: 3, comentarios: 1234, aulasConcluidas: 12 }));
  simularApi(({ rota }) => {
    if (rota.endsWith('/restricoes')) return Response.json([]);
    assert.equal(rota, '/ranking/alunos');
    return Response.json(alunos);
  });
  await renderizar(Ranking, { sessao: { idUsuario: 7, perfil: 'ALUNO' } });
  assert.equal(document.querySelectorAll('tbody tr').length, 10);
  assert.match(document.querySelector('tbody tr').textContent, /Aluno 1/);
  assert.match(document.querySelector('tbody tr').textContent, /1\.234/);
  assert.equal(document.querySelector('[aria-label="Level 3"]').disabled, true);
  await clicar('Próxima', document.querySelector('[aria-label="Páginas do ranking"]'));
  assert.equal(document.querySelectorAll('tbody tr').length, 1);
  assert.match(document.querySelector('tbody tr').textContent, /Aluno 11/);
});

test('erro no ranking é apresentado sem inventar alunos', async () => {
  simularApi(({ rota }) => rota.endsWith('/restricoes') ? Response.json([]) : new Response(null, { status: 503 }));
  await renderizar(Ranking, { sessao: { idUsuario: 7, perfil: 'ALUNO' } });
  assert.match(document.querySelector('[role="alert"]').textContent, /indisponível/);
  assert.equal(document.querySelector('tbody'), null);
});

test('tabela vazia orienta que ainda não há participantes', async () => {
  await renderizar(Tabela, { props: { alunos: [] } });
  assert.match(document.body.textContent, /Ainda não há alunos no ranking/);
  assert.equal(document.querySelector('table'), null);
});
