import { test } from 'vitest';
import assert from 'node:assert/strict';
import { act, createElement as h } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { prepararTela, botao, clicar, preencher, simularApi } from './apoio/tela.js';

let Forum;
const { renderizar: montar } = prepararTela(async (carregar) => {
  Forum = (await carregar('componentes/forum/PaginaForum.jsx')).default;
});

function ForumComNavegacao() {
  const location = useLocation();
  const navigate = useNavigate();
  return h('div', null, h('output', { 'data-testid': 'url' }, location.pathname),
    h('button', { onClick: () => navigate(-1) }, 'Voltar no navegador'),
    h('button', { onClick: () => navigate(1) }, 'Avançar no navegador'), h(Forum));
}
function renderizar(_Pagina, opcoes = {}) {
  return montar(ForumComNavegacao, { url: '/forum', rota: '/forum/:idTopico?', ...opcoes });
}

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
    if (rota === '/forum/topicos/12' && metodo === 'GET') return Response.json(topicos[0]);
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
  assert.doesNotMatch(item.textContent, /Gamertag|#1a3b5c7d/);
  assert.equal(item.getAttribute('href'), '/forum/12');
  await act(async () => item.click());
  assert.match(document.querySelector('.detalhe-topico .meta-detalhe').textContent, /#1a3b5c7d/);
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


test('oculta ofensas ao sair do campo e na exibição de tópicos antigos', async () => {
  prepararApi([{ ...topico, titulo: 'idiota', descricao: 'pau no cu' }]);
  await renderizar(Forum, { sessao });
  assert.equal(document.querySelector('.topic-title').textContent, '***');
  await act(async () => document.querySelector('.topic-list-item').click());
  assert.equal(document.querySelector('.content-text').textContent, '***');
  await preencher('textarea', 'Isso é lixo, fodace e foda-se.');
  await act(async () => document.querySelector('textarea').dispatchEvent(new window.FocusEvent('focusout', { bubbles: true })));
  assert.equal(document.querySelector('textarea').value, 'Isso é ***, *** e ***.');
});

test('alerta sobre o intervalo de tópicos sem apagar o texto digitado', async () => {
  simularApi(({ rota, metodo }) => {
    if (rota === '/autenticacao/restricoes' || rota === '/forum/users') return Response.json([]);
    if (rota === '/forum/topicos' && metodo === 'GET') return Response.json([]);
    if (rota === '/forum/topicos' && metodo === 'POST') return Response.json({
      codigo: 'OPERACAO_RECUSADA', mensagem: 'Aguarde 3 minutos antes de criar outro tópico.',
    }, { status: 429 });
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Forum, { sessao });
  await clicar('Novo tópico');
  await preencher('[aria-label="Título da postagem"]', 'Título preservado');
  await preencher('textarea', 'Descrição preservada');
  await clicar('Publicar');
  assert.match(document.querySelector('[role="alert"]').textContent, /3 minutos/);
  assert.equal(document.querySelector('textarea').value, 'Descrição preservada');
});

test('alerta sobre o intervalo de comentários sem apagar a resposta', async () => {
  simularApi(({ rota, metodo }) => {
    if (rota === '/autenticacao/restricoes' || rota === '/forum/users') return Response.json([]);
    if (rota === '/forum/topicos') return Response.json([topico]);
    if (rota === '/forum/topicos/12') return Response.json(topico);
    if (rota === '/forum/topicos/12/comentarios' && metodo === 'GET') return Response.json([]);
    if (rota === '/forum/topicos/12/comentarios' && metodo === 'POST') return Response.json({
      codigo: 'OPERACAO_RECUSADA', mensagem: 'Aguarde 20 segundos entre comentários.',
    }, { status: 429 });
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());
  await preencher('textarea', 'Resposta preservada');
  await clicar('Responder');
  assert.match(document.querySelector('[role="alert"]').textContent, /20 segundos/);
  assert.equal(document.querySelector('textarea').value, 'Resposta preservada');
});

test('aluno edita seu tópico mas não pode fechar ou arquivar', async () => {
  prepararApi();
  await renderizar(Forum, { sessao: { perfil: 'ALUNO', idUsuario: 5 } });
  await act(async () => document.querySelector('.topic-list-item').click());
  assert.ok(botao('Editar tópico'));
  assert.equal(botao('Fechar tópico'), undefined);
  assert.equal(botao('Arquivar tópico'), undefined);
  await clicar('Editar tópico');
  assert.ok(botao('Salvar alterações'));
});

test('respostas paginadas carregam somente a página escolhida', async () => {
  const respostas = Array.from({ length: 21 }, (_, indice) => ({ id: indice + 1, idAutor: 8, nomeAutor: 'Autor', conteudo: `Resposta ${indice + 1}`, ativo: true }));
  const chamadas = simularApi(({ rota, busca }) => {
    if (rota === '/autenticacao/restricoes' || rota === '/forum/users') return Response.json([]);
    if (rota === '/forum/topicos') return Response.json([topico]);
    if (rota === '/forum/topicos/12') return Response.json(topico);
    if (rota === '/forum/topicos/12/comentarios') {
      const pagina = Number(busca.get('page'));
      assert.equal(busca.get('size'), '20');
      return Response.json({ itens: respostas.slice(pagina * 20, (pagina + 1) * 20), pagina, totalPaginas: 2, totalElementos: 21 });
    }
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());
  assert.equal(document.querySelectorAll('.comment-card').length, 20);
  assert.match(document.querySelector('.titulo-respostas').textContent, /21/);
  const navegacao = () => document.querySelector('[aria-label="Páginas de respostas"]');
  await clicar('Próxima', navegacao());
  assert.equal(document.querySelectorAll('.comment-card').length, 1);
  assert.match(document.querySelector('.comment-card').textContent, /Resposta 21/);
  assert.match(navegacao().textContent, /Página 2 de 2/);
  await clicar('Anterior', navegacao());
  assert.equal(document.querySelectorAll('.comment-card').length, 20);
  assert.deepEqual(chamadas.filter(item => item.rota.endsWith('/comentarios')).map(item => item.busca.get('page')), ['0', '1', '0']);
});

test('nova resposta abre a última página sem carregar todas as anteriores', async () => {
  let publicou = false;
  simularApi(({ rota, busca, metodo }) => {
    if (rota === '/autenticacao/restricoes' || rota === '/forum/users') return Response.json([]);
    if (rota === '/forum/topicos') return Response.json([topico]);
    if (rota === '/forum/topicos/12') return Response.json(topico);
    if (rota === '/forum/topicos/12/comentarios') {
      if (metodo === 'POST') { publicou = true; return Response.json({ id: 21 }); }
      const pagina = Number(busca.get('page'));
      const itens = pagina === 1 ? [{ id: 21, idAutor: 5, conteudo: 'Resposta nova' }]
        : Array.from({ length: 20 }, (_, indice) => ({ id: indice + 1, idAutor: 8, conteudo: `Antiga ${indice}` }));
      return Response.json({ itens, pagina, totalPaginas: publicou ? 2 : 1, totalElementos: publicou ? 21 : 20 });
    }
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());
  await preencher('textarea', 'Resposta nova');
  await clicar('Responder');
  assert.equal(document.querySelectorAll('.comment-card').length, 1);
  assert.match(document.querySelector('.comment-card').textContent, /Resposta nova/);
  assert.match(document.querySelector('[aria-label="Páginas de respostas"]').textContent, /Página 2 de 2/);
});


test('abrir tópico altera a URL e permite voltar e avançar pelo histórico', async () => {
  prepararApi();
  await renderizar(Forum, { sessao });
  await act(async () => document.querySelector('.topic-list-item').click());
  assert.equal(document.querySelector('[data-testid="url"]').textContent, '/forum/12');
  assert.equal(document.querySelector('.detalhe-topico h3').textContent, topico.titulo);
  await clicar('Voltar no navegador');
  assert.equal(document.querySelector('[data-testid="url"]').textContent, '/forum');
  assert.ok(document.querySelector('.topic-list-item'));
  await clicar('Avançar no navegador');
  assert.equal(document.querySelector('.detalhe-topico h3').textContent, topico.titulo);
  await clicar('Voltar para a lista');
  assert.equal(document.querySelector('[data-testid="url"]').textContent, '/forum');
});

test('link direto carrega tópico fora da página atual e permite editar', async () => {
  simularApi(({ rota, metodo, dados }) => {
    if (rota === '/autenticacao/restricoes' || rota === '/forum/users' || rota === '/forum/topicos') return Response.json([]);
    if (rota === '/forum/topicos/12') return Response.json(metodo === 'PUT' ? { ...topico, ...dados } : topico);
    if (rota === '/forum/topicos/12/comentarios') return Response.json([]);
    throw new Error('Rota inesperada: ' + rota);
  });
  await renderizar(Forum, { sessao, url: '/forum/12' });
  assert.equal(document.querySelector('.detalhe-topico h3').textContent, topico.titulo);
  await clicar('Editar tópico');
  await preencher('[aria-label="Título da postagem"]', 'Título atualizado por link direto');
  await clicar('Salvar alterações');
  assert.equal(document.querySelector('.detalhe-topico h3').textContent, 'Título atualizado por link direto');
  assert.equal(document.querySelector('[data-testid="url"]').textContent, '/forum/12');
});

test('link de tópico indisponível exibe erro e permite voltar ao fórum', async () => {
  simularApi(({ rota }) => {
    if (rota === '/forum/topicos/999') return Response.json({ mensagem: 'Tópico não encontrado.' }, { status: 404 });
    return Response.json([]);
  });
  await renderizar(Forum, { sessao, url: '/forum/999' });
  assert.ok(document.querySelector('[role="alert"]'));
  assert.equal(document.querySelector('.detalhe-topico'), null);
  await clicar('Voltar para a lista');
  assert.equal(document.querySelector('[data-testid="url"]').textContent, '/forum');
});
