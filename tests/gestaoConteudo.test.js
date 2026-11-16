import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { Route, useLocation } from 'react-router-dom';
import { prepararTela, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let Gestao, InicioCursos, EditorCaminhos, FormularioConteudo;
const { renderizar } = prepararTela(async (carregar) => {
  FormularioConteudo = (await carregar('componentes/aulas/componentes/FormularioConteudo.jsx')).default;
  Gestao = (await carregar('componentes/aulas/PaginaGestaoCursos.jsx')).default;
  InicioCursos = (await carregar('componentes/aulas/InicioCursos.jsx')).default;
  EditorCaminhos = (await carregar('componentes/aulas/componentes/EditorCaminhos.jsx')).default;
});

for (const [perfil, destino] of [
  ['ALUNO', '/aluno/cursos'],
  ['PROFESSOR', '/professor/cursos'],
  ['ADMINISTRADOR', '/administracao/cursos'],
]) {
  test('entrada de cursos leva o perfil ' + perfil + ' à área correspondente', async () => {
    function Destino() {
      const { pathname, search } = useLocation();
      return h('p', null, pathname + search);
    }

    await renderizar(InicioCursos, {
      url: '/cursos?busca=web', sessao: { perfil },
      extra: [h(Route, { key: 'destino', path: destino, element: h(Destino) })],
    });
    assert.equal(document.querySelector('p').textContent, destino + '?busca=web');
  });
}

test('professor valida, cadastra, edita e exclui uma aula', async () => {
  const chamadas = simularApi(({ rota, metodo, dados }) => {
    if (rota === '/cursos/1') return Response.json({ id: 1, titulo: 'Web' });
    if (rota === '/modulos/2') return Response.json({ id: 2, idCurso: 1, titulo: 'Introdução' });
    if (rota === '/modulos/2/aulas') {
      return Response.json(metodo === 'POST' ? { id: 3, ...dados, youtubeVideoId: 'abcdefghijk' } : []);
    }
    if (rota === '/aulas/3' && metodo === 'PUT') return Response.json({ id: 3, ...dados, youtubeVideoId: 'abcdefghijk' });
    if (rota === '/aulas/3' && metodo === 'DELETE') return new Response(null, { status: 204 });
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Gestao, {
    url: '/professor/cursos/1/modulos/2/aulas', rota: '/professor/cursos/:idCurso/modulos/:idModulo/aulas',
    sessao: { perfil: 'PROFESSOR' },
  });

  await clicar('Cadastrar aula');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /Preencha o título/);
  await preencher('#conteudo-titulo', ' Primeira aula ');
  await preencher('#conteudo-descricao', ' Introdução ao curso ');
  await preencher('#conteudo-ordem', '0');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /inteiro positivo/);
  await preencher('#conteudo-ordem', '2');
  await preencher('#conteudo-youtube', 'https://example.com/video');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /link válido/);

  await preencher('#conteudo-youtube', 'https://youtu.be/abcdefghijk');
  await enviar();
  assert.deepEqual(chamadas.at(-1).dados, {
    titulo: 'Primeira aula', descricao: 'Introdução ao curso', ordem: 2, youtubeUrl: 'https://youtu.be/abcdefghijk',
  });

  await clicar('Editar');
  await preencher('#conteudo-titulo', 'Primeiros passos');
  await enviar();
  assert.equal(chamadas.at(-1).metodo, 'PUT');
  assert.match(document.querySelector('article').textContent, /Primeiros passos/);

  await clicar('Excluir');
  await clicar('Cancelar', document.querySelector('[role="dialog"]'));
  assert.equal(chamadas.at(-1).metodo, 'PUT');
  await clicar('Excluir');
  await clicar('Confirmar');
  assert.equal(chamadas.at(-1).metodo, 'DELETE');
  assert.match(document.querySelector('.empty-list').textContent, /Nenhum conteúdo cadastrado/);
});

test('editor de caminhos limpa destinos removidos e normaliza os assuntos', async () => {
  const onSalvar = vi.fn();
  const dados = { titulo: 'Seu caminho', descricao: '', publicado: false, perguntas: [], resultados: [] };
  await renderizar(EditorCaminhos, { props: { dados, onSalvar } });
  await clicar('Adicionar pergunta');
  await clicar('Adicionar pergunta');
  await clicar('Adicionar resultado');
  await preencher('#enunciado-pergunta-1', 'O que você quer criar?');
  await preencher('#opcao-pergunta-1-0', 'Interfaces');
  await preencher('#destino-pergunta-1-0', 'pergunta:pergunta-2');
  await preencher('#destino-pergunta-1-1', 'resultado:resultado-1');

  const segunda = [...document.querySelectorAll('.editor-pergunta')][1];
  await clicar('Remover pergunta', segunda);
  assert.equal(document.querySelector('#destino-pergunta-1-0').value, '');
  await clicar('Remover resultado');
  assert.equal(document.querySelector('#destino-pergunta-1-1').value, '');

  await clicar('Adicionar resultado');
  await preencher('#resultado-titulo-resultado-1', 'Desenvolvimento web');
  await preencher('#resultado-texto-resultado-1', 'Comece pelas interfaces.');
  await preencher('#resultado-temas-resultado-1', '  HTML  \n\n CSS ');
  await preencher('#destino-pergunta-1-0', 'resultado:resultado-1');
  await enviar();

  const salvo = onSalvar.mock.calls[0][0];
  assert.equal(salvo.perguntaInicial, 'pergunta-1');
  assert.deepEqual(salvo.perguntas[0].opcoes[0], { texto: 'Interfaces', proximaPergunta: null, resultado: 'resultado-1' });
  assert.deepEqual(salvo.resultados[0].temasPesquisa, ['HTML', 'CSS']);
});

test('editor de caminhos não salva resultado com mais de 15 assuntos', async () => {
  const onSalvar = vi.fn();
  const dados = { titulo: 'Seu caminho', descricao: '', publicado: false, perguntas: [], resultados: [] };
  await renderizar(EditorCaminhos, { props: { dados, onSalvar } });
  await clicar('Adicionar resultado');
  await preencher('#resultado-temas-resultado-1', Array.from({ length: 16 }, (_, i) => 'Tema ' + i).join('\n'));
  await enviar();

  assert.match(document.querySelector('[role="alert"]').textContent, /até 15 assuntos/);
  assert.equal(onSalvar.mock.calls.length, 0);
});

test('edição de curso mantém a área e permite remover a capa', async () => {
  simularApi(() => Response.json([{ id: 4, nome: 'Web' }]));
  const onSalvar = vi.fn();
  const item = { titulo: 'Curso de React', descricao: 'Introdução', idTema: 4, idArea: 2, capaJpeg: 'capa-existente' };
  await renderizar(FormularioConteudo, { props: { tipo: 'curso', item, onSalvar } });

  assert.equal(document.querySelector('select').value, '4');
  await clicar('Remover capa');
  await enviar();

  assert.deepEqual(onSalvar.mock.calls[0][0], {
    titulo: 'Curso de React', descricao: 'Introdução', idTema: 4, idArea: 2, capaJpeg: null,
  });
});
