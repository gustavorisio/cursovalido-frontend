import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { Route } from 'react-router-dom';
import { prepararTela, botao, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let Noticias, Noticia, Editor;
const autor = { perfil: 'ADMINISTRADOR', idUsuario: 3 };
const noticia = { id: 7, titulo: 'Nova turma', conteudo: 'As inscrições estão abertas.', idAutor: 3, criadoEm: '2026-05-01', atualizadoEm: '2026-05-02' };

const { renderizar } = prepararTela(async (carregar) => {
  Noticias = (await carregar('paginas/Noticias.jsx')).default;
  Noticia = (await carregar('paginas/Noticia.jsx')).default;
  Editor = (await carregar('paginas/EditorNoticia.jsx')).default;
});

test('lista notícias, avança a página e volta ao início ao pesquisar', async (t) => {
  const chamadas = simularApi(t, ({ busca }) => Response.json(busca.get('busca') !== '' || busca.get('page') === '1'
    ? []
    : Array.from({ length: 12 }, (_, indice) => ({ ...noticia, id: indice + 1 }))));
  await renderizar(Noticias, { url: '/noticias?pagina=-1', sessao: autor });

  assert.equal(document.querySelectorAll('article').length, 12);
  assert.equal(document.querySelector('a[href="/noticias/nova"]').textContent, 'Publicar notícia');
  assert.equal(botao('Anterior').disabled, true);
  await clicar('Próxima');
  assert.equal(chamadas.at(-1).busca.get('page'), '1');
  assert.match(document.body.textContent, /Nenhuma notícia por aqui/);

  await preencher('input[type="search"]', '  javascript  ');
  await enviar();
  assert.equal(chamadas.at(-1).busca.get('page'), '0');
  assert.equal(chamadas.at(-1).busca.get('busca'), 'javascript');
  assert.match(document.body.textContent, /Nenhuma notícia encontrada/);
});

test('repete a consulta da notícia depois de uma falha', async (t) => {
  let primeira = true;
  simularApi(t, () => {
    if (primeira) {
      primeira = false;
      return Response.json({}, { status: 503 });
    }
    return Response.json(noticia);
  });
  await renderizar(Noticia, { url: '/noticias/7', rota: '/noticias/:id' });
  assert.ok(document.querySelector('[role="alert"]'));

  await clicar('Tentar novamente');
  assert.equal(document.querySelector('h1').textContent, noticia.titulo);
  assert.equal(document.querySelectorAll('time').length, 2);
  assert.equal(botao('Excluir notícia'), undefined);
});

test('autor pode cancelar e depois confirmar a exclusão da notícia', async (t) => {
  const chamadas = simularApi(t, ({ metodo }) => metodo === 'DELETE' ? new Response(null, { status: 204 }) : Response.json(noticia));
  await renderizar(Noticia, {
    url: '/noticias/7', rota: '/noticias/:id', sessao: autor,
    extra: [h(Route, { key: 'lista', path: '/noticias', element: h('h1', null, 'Lista de notícias') })],
  });
  await clicar('Excluir notícia');
  await clicar('Cancelar', document.querySelector('[role="dialog"]'));
  assert.equal(chamadas.length, 1);

  await clicar('Excluir notícia');
  await clicar('Confirmar');
  assert.equal(chamadas.at(-1).metodo, 'DELETE');
  assert.equal(chamadas.at(-1).rota, '/noticias/7');
  assert.equal(document.querySelector('h1').textContent, 'Lista de notícias');
});

test('editor exige título e conteúdo e publica os valores sem espaços nas pontas', async (t) => {
  const chamadas = simularApi(t, () => Response.json(noticia));
  await renderizar(Editor, {
    url: '/noticias/nova', sessao: autor,
    extra: [h(Route, { key: 'publicada', path: '/noticias/:id', element: h('h1', null, 'Notícia publicada') })],
  });
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /Preencha título e conteúdo/);
  assert.equal(chamadas.length, 0);

  await preencher('input', ' Nova turma ');
  await preencher('textarea', ' As inscrições estão abertas. ');
  await enviar();
  assert.equal(chamadas[0].metodo, 'POST');
  assert.deepEqual(chamadas[0].dados, { titulo: noticia.titulo, conteudo: noticia.conteudo });
  assert.equal(document.querySelector('h1').textContent, 'Notícia publicada');
});

test('autor edita notícia e mantém o texto quando a API recusa o envio', async (t) => {
  const chamadas = simularApi(t, ({ metodo }) => metodo === 'PUT'
    ? Response.json({}, { status: 503 })
    : Response.json(noticia));
  await renderizar(Editor, { url: '/noticias/7/editar', rota: '/noticias/:id/editar', sessao: autor });

  assert.equal(document.querySelector('input').value, noticia.titulo);
  await preencher('input', 'Inscrições prorrogadas');
  await enviar();
  assert.equal(chamadas.at(-1).metodo, 'PUT');
  assert.equal(chamadas.at(-1).dados.titulo, 'Inscrições prorrogadas');
  assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(document.querySelector('input').value, 'Inscrições prorrogadas');
});

test('outro administrador não recebe o formulário de edição', async (t) => {
  simularApi(t, () => Response.json(noticia));
  await renderizar(Editor, { url: '/noticias/7/editar', rota: '/noticias/:id/editar', sessao: { ...autor, idUsuario: 9 } });

  assert.match(document.querySelector('[role="alert"]').textContent, /Somente o autor/);
  assert.equal(document.querySelector('form'), null);
});
