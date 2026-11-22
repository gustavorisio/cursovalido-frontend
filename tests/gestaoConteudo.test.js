import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { Route, useLocation } from 'react-router-dom';
import { prepararTela, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let Gestao, InicioCursos, FormularioConteudo;
const { renderizar } = prepararTela(async (carregar) => {
  FormularioConteudo = (await carregar('componentes/aulas/componentes/FormularioConteudo.jsx')).default;
  Gestao = (await carregar('componentes/aulas/PaginaGestaoCursos.jsx')).default;
  InicioCursos = (await carregar('componentes/aulas/InicioCursos.jsx')).default;
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
      return Response.json(metodo === 'POST' ? { id: 3, ...dados, youtubeVideoId: 'abcdefghijk', vimeoVideoUrl: dados.vimeoUrl } : []);
    }
    if (rota === '/aulas/3' && metodo === 'PUT') return Response.json({ id: 3, ...dados, youtubeVideoId: 'abcdefghijk', vimeoVideoUrl: dados.vimeoUrl });
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
  assert.match(document.querySelector('[role="alert"]').textContent, /Server 1 \(Vimeo\).*Server 2 \(YouTube\)/);

  await preencher('#conteudo-youtube', 'https://youtu.be/abcdefghijk');
  await preencher('#conteudo-vimeo', 'https://vimeo.com/123456789');
  await enviar();
  assert.deepEqual(chamadas.at(-1).dados, {
    titulo: 'Primeira aula', descricao: 'Introdução ao curso', ordem: 2, youtubeUrl: 'https://youtu.be/abcdefghijk', vimeoUrl: 'https://vimeo.com/123456789',
  });

  await clicar('Editar');
  await preencher('#conteudo-titulo', 'Primeiros passos');
  await preencher('#conteudo-vimeo', 'https://vimeo.com/123456789');
  await preencher('#conteudo-youtube', 'https://youtu.be/abcdefghijk');
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

test('edição de curso mantém a área e permite remover a capa', async () => {
  simularApi(() => Response.json([{ id: 4, nome: 'Web' }]));
  const onSalvar = vi.fn();
  const item = { titulo: 'Curso de React', descricao: 'Introdução', idTema: 4, idArea: 2, capaJpeg: 'capa-existente' };
  await renderizar(FormularioConteudo, { props: { tipo: 'curso', item, onSalvar } });

  assert.equal(document.querySelector('select').value, '4');
  await clicar('Remover capa');
  await enviar();

  assert.deepEqual(onSalvar.mock.calls[0][0], {
    titulo: 'Curso de React', descricao: 'Introdução', idTema: 4, capaJpeg: null,
  });
});
