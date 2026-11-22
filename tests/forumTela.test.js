import { test } from 'vitest';
import assert from 'node:assert/strict';
import { act } from 'react';
import { prepararTela, botao, clicar, preencher, simularApi } from './apoio/tela.js';

let Forum;
const { renderizar } = prepararTela(async (carregar) => {
  Forum = (await carregar('componentes/forum/PaginaForum.jsx')).default;
});

const sessao = { perfil: 'ADMINISTRADOR', idUsuario: 5 };
const topico = { id: 12, idAutor: 5, gamertagAutor: '#1a3b5c7d', titulo: 'Dúvida sobre React', descricao: 'Como uso o estado?', criadoEm: '2026-04-10' };

function prepararApi(lista = [topico]) {
  let topicos = lista;
  let comentarios = [];
  return simularApi(({ rota, metodo, dados }) => {
    if (rota === '/autenticacao/restricoes') return Response.json([]);
    if (rota === '/forum/users') return Response.json({ value: [{ id: 5, nome: 'Ana', perfil: 'ADMINISTRADOR' }], count: 1 });
    if (rota === '/forum/topicos' && metodo === 'GET') return Response.json(topicos);
    if (rota === '/forum/topicos' && metodo === 'POST') {
      const novo = { ...topico, ...dados };
      topicos = [novo];
      return Response.json(novo);
    }
    if (rota === '/forum/topicos/12' && metodo === 'PUT') {
      const atualizado = { ...topicos[0], ...dados };
      topicos = [atualizado];
      return Response.json(atualizado);
    }
    if (rota === '/forum/topicos/12/comentarios') {
      if (metodo === 'POST') comentarios = [{ id: 20, idAutor: 5, gamertagAutor: '#8e6f4g2h', ...dados, criadoEm: '2026-04-11' }];
      return Response.json(comentarios);
    }
    if (rota === '/forum/comentarios/20') {
      comentarios = [{ ...comentarios[0], ...(metodo === 'DELETE' ? { ativo: false } : dados) }];
      return new Response(null, { status: 204 });
    }
    if (rota.endsWith('/fechar')) topicos = [{ ...topicos[0], fechado: true }];
    else if (rota.endsWith('/arquivar') || metodo === 'DELETE') topicos = [];
    else throw new Error('Rota inesperada: ' + rota);
    return new Response(null, { status: 204 });
  });
}

test('publica e edita um tópico a partir da listagem do fórum', async () => {
  const chamadas = prepararApi([]);
  await renderizar(Forum, { sessao });

  await clicar('Novo tópico');
  await clicar('Publicar');
  assert.match(document.querySelector('[role="alert"]').textContent, /Preencha o título/);
  assert.equal(chamadas.some(({ metodo }) => metodo === 'POST'), false);
  await clicar('Fechar');
  await preencher('[aria-label="Título da postagem"]', topico.titulo);
  await preencher('textarea', topico.descricao);
  await clicar('Publicar');
  assert.match(document.querySelector('[role="status"]').textContent, /Tópico publicado/);

  const item = document.querySelector('.topic-list-item');
  assert.match(item.textContent, /Dúvida sobre React/);
  assert.match(item.textContent, /#1a3b5c7d/);
  await act(async () => item.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  await clicar('Editar tópico');
  await preencher('[aria-label="Título da postagem"]', 'Dúvida resolvida');
  await clicar('Salvar alterações');

  assert.equal(chamadas.find(({ metodo }) => metodo === 'PUT').dados.titulo, 'Dúvida resolvida');
  assert.equal(document.querySelector('.detalhe-topico h3').textContent, 'Dúvida resolvida');
  await clicar('Voltar para a lista');
  assert.match(document.querySelector('.topic-list-item').textContent, /Dúvida resolvida/);
});

test('publica, edita e apaga uma resposta do próprio usuário', async () => {
  const chamadas = prepararApi();
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());

  await clicar('Responder');
  assert.match(document.querySelector('[role="alert"]').textContent, /Preencha o comentário/);
  await preencher('textarea', 'Use o hook useState.');
  await clicar('Responder');
  assert.match(document.querySelector('.comment-card').textContent, /useState/);
  assert.match(document.querySelector('.comment-card').textContent, /#8e6f4g2h/);

  await clicar('Editar');
  assert.equal(document.querySelectorAll('.comment-card textarea').length, 1);
  assert.equal(document.querySelector('.detalhe-topico > .formulario-comentario'), null);
  assert.equal(document.querySelector('.comment-card .subtitulo-formulario').textContent, 'Editar comentário');
  await preencher('textarea', 'Use useState ou useReducer.');
  await clicar('Salvar alterações');
  const edicao = chamadas.find(({ metodo }) => metodo === 'PUT');
  assert.equal(edicao.rota, '/forum/comentarios/20');
  assert.deepEqual(edicao.dados, { conteudo: 'Use useState ou useReducer.' });

  await clicar('Apagar');
  await clicar('Cancelar', document.querySelector('[role="dialog"]'));
  assert.equal(chamadas.some(({ metodo }) => metodo === 'DELETE'), false);
  await clicar('Apagar');
  await clicar('Confirmar');

  assert.match(document.querySelector('.comment-card').textContent, /Esta mensagem foi excluída/);
  assert.equal(botao('Editar'), undefined);
});

test('fecha o tópico e retira o formulário de respostas', async () => {
  const chamadas = prepararApi();
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());

  await clicar('Fechar tópico');
  await clicar('Confirmar');
  assert.equal(chamadas.find(({ metodo }) => metodo === 'PUT').rota, '/forum/topicos/12/fechar');
  assert.match(document.querySelector('.aviso-fechado').textContent, /fechado para novas respostas/);
  assert.equal(botao('Responder'), undefined);
});

test('arquivamento é a única opção para retirar o tópico da lista', async () => {
  const chamadas = prepararApi();
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());

  assert.equal(botao('Apagar postagem'), undefined);
  await clicar('Arquivar tópico');
  assert.match(document.querySelector('[role="dialog"]').textContent, /permanentemente/);
  assert.equal(chamadas.some(({ metodo }) => metodo === 'PUT'), false);
  await clicar('Confirmar');
  assert.equal(chamadas.find(({ metodo }) => metodo === 'PUT').rota, '/forum/topicos/12/arquivar');
  assert.match(document.querySelector('.empty-list').textContent, /Nenhum tópico encontrado/);
});

test('restrição expirada libera o fórum até uma nova suspensão', async () => {
  let restricoes = [{ escopo: 'CONTA', expiraEm: '2020-01-01T00:00:00Z' }];
  simularApi(({ rota }) => {
    if (rota === '/autenticacao/restricoes') return Response.json(restricoes);
    if (rota === '/forum/users' || rota === '/forum/topicos') return Response.json([]);
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Forum, { sessao });
  assert.equal(botao('Novo tópico').disabled, false);

  restricoes = [{ escopo: 'FORUM', expiraEm: null }];
  await act(async () => window.dispatchEvent(new window.Event('curso-valido-restricoes-alteradas')));
  assert.equal(botao('Novo tópico').disabled, true);
});

