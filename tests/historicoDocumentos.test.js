import { test } from 'vitest';
import assert from 'node:assert/strict';
import { act } from 'react';
import { prepararTela, clicar, simularApi } from './apoio/tela.js';

let Termos, Privacidade, Rodape;
const { renderizar } = prepararTela(async (carregar) => {
  Termos = (await carregar('paginas/TermosDeUso.jsx')).default;
  Privacidade = (await carregar('paginas/PoliticaDePrivacidade.jsx')).default;
  Rodape = (await carregar('componentes/comuns/Rodape.jsx')).default;
});

function prepararDialogo() {
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
}

for (const tipo of ['termos', 'privacidade']) {
  test('histórico de ' + tipo + ' pode ser lido sem login em janela interna', async () => {
    prepararDialogo();
    const rota = tipo === 'termos' ? '/politicas/historico' : '/politicas/privacidade/historico';
    const chamadas = simularApi(({ rota: caminho }) => Response.json(caminho === rota
      ? [{ nome: 'Documento antigo', versao: '1.0', dataPublicacao: '2026-10-10T12:00:00', conteudo: 'Texto da versão antiga' }]
      : caminho === '/politicas/ativas' ? [{ versao: '2.0', conteudo: 'Termos atuais' }] : { versao: '2.0', conteudo: 'Privacidade atual' }));
    await renderizar(tipo === 'termos' ? Termos : Privacidade, { url: tipo === 'termos' ? '/termos-aceite.html' : '/politica-privacidade.html' });
    const botao = [...document.querySelectorAll('footer button')].find((item) => item.textContent === 'Histórico de versões');
    assert.ok(botao);
    await clicar('Histórico de versões');
    assert.ok(document.querySelector('dialog').open);
    assert.ok(chamadas.some((chamada) => chamada.rota === rota));
    const versao = document.querySelector('dialog nav button');
    assert.match(versao.textContent, /1.0.*10 de outubro de 2026/);
    await act(async () => versao.click());
    assert.match(document.querySelector('dialog section').textContent, /Versão: 1.0.*Publicada em: 10 de outubro de 2026/);
    assert.match(document.querySelector('dialog section').textContent, /Texto da versão antiga/);
    assert.match(document.querySelector('main').textContent, /atuais|atual/);
    await clicar('Fechar histórico');
    assert.equal(document.querySelector('dialog'), null);
  });
}

test('histórico não aparece no rodapé das outras páginas', async () => {
  await renderizar(Rodape, { url: '/login', props: { onHistorico: () => {} } });
  assert.doesNotMatch(document.querySelector('footer').textContent, /Histórico de versões/);
});

test('histórico oferece nova tentativa após falha e informa lista vazia', async () => {
  prepararDialogo();
  let falhar = true;
  simularApi(({ rota }) => {
    if (rota === '/politicas/historico') {
      if (falhar) { falhar = false; return Response.json({}, { status: 503 }); }
      return Response.json([]);
    }
    return Response.json([{ versao: '2.0', conteudo: 'Termos atuais' }]);
  });
  await renderizar(Termos, { url: '/termos-aceite.html' });
  await clicar('Histórico de versões');
  assert.match(document.querySelector('dialog [role="alert"]').textContent, /Não foi possível carregar/);
  await clicar('Tentar novamente');
  assert.match(document.querySelector('dialog').textContent, /Nenhuma versão anterior/);
});
