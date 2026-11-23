import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { act } from 'react';
import { prepararTela, clicar, simularApi } from './apoio/tela.js';

let api, DadosUsuario, Aviso;
const { renderizar } = prepararTela(async (carregar) => {
  api = await carregar('servicos/api.js');
  DadosUsuario = (await carregar('componentes/autenticacao/DadosUsuario.jsx')).default;
  Aviso = (await carregar('componentes/comuns/AvisoIntervaloAcao.jsx')).default;
});

test('frontend usa o prazo enviado pela API, sem copiar regras de rotas', async () => {
  let agora = Date.now();
  vi.spyOn(Date, 'now').mockImplementation(() => agora);
  const chamadas = simularApi(() => Response.json({}, { headers: { 'X-Intervalo-Acao': '7' } }));
  const enviar = body => api.requisitar('/acao-nova', { method: 'POST', body: JSON.stringify({ texto: body }) });
  await enviar('primeiro');
  await assert.rejects(() => enviar('outro'), /7 segundos/);
  agora += 6500;
  await assert.rejects(() => enviar('outro'), /1 segundos/);
  agora += 500;
  await enviar('outro');
  assert.equal(chamadas.length, 2);
  assert.doesNotMatch(sessionStorage.getItem('curso-valido-intervalos-acoes'), /primeiro|outro/);
});

test('sem prazo da API, nenhum intervalo é inventado no frontend', async () => {
  const chamadas = simularApi(() => Response.json({}));
  for (const caminho of ['/administracao/usuarios', '/autenticacao/exportar-dados', '/forum/topicos']) {
    await api.requisitar(caminho, { method: 'POST' });
    await api.requisitar(caminho, { method: 'POST' });
  }
  assert.equal(chamadas.length, 6);
});

test('baixar JSON respeita os 10 segundos recebidos da API', async () => {
  let agora = Date.now();
  vi.spyOn(Date, 'now').mockImplementation(() => agora);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:teste');
  vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const chamadas = simularApi(({ rota }) => Response.json({ id: 5, nomeCompleto: 'Ana', email: 'ana@example.com', perfil: 'ALUNO' },
    rota.endsWith('/exportar-dados') ? { headers: { 'X-Intervalo-Acao': '10' } } : {}));
  await renderizar(DadosUsuario, { sessao: { perfil: 'ALUNO', idUsuario: 5 } });
  await clicar('Baixar meus dados pessoais');
  await clicar('Baixar meus dados pessoais');
  assert.match(document.querySelector('[role="alert"]').textContent, /10 segundos/);
  assert.equal(chamadas.filter(item => item.rota.endsWith('/exportar-dados')).length, 1);
  agora += 10000;
  await clicar('Baixar meus dados pessoais');
  assert.equal(chamadas.filter(item => item.rota.endsWith('/exportar-dados')).length, 2);
});

test('duas etapas respeita os 30 segundos recebidos da API', async () => {
  let agora = Date.now();
  vi.spyOn(Date, 'now').mockImplementation(() => agora);
  const chamadas = simularApi(({ metodo }) => metodo === 'PUT'
    ? new Response(null, { status: 204, headers: { 'X-Intervalo-Acao': '30' } })
    : Response.json({ id: 5, nomeCompleto: 'Ana', email: 'ana@example.com', perfil: 'ALUNO', doisFatoresAtivos: false }));
  await renderizar(DadosUsuario, { sessao: { perfil: 'ALUNO', idUsuario: 5 } });
  await clicar('Ativar autenticação em duas etapas');
  await clicar('Desativar autenticação em duas etapas');
  assert.match(document.querySelector('[role="alert"]').textContent, /30 segundos/);
  assert.equal(chamadas.filter(item => item.metodo === 'PUT').length, 1);
  agora += 30000;
  await clicar('Desativar autenticação em duas etapas');
  assert.equal(chamadas.filter(item => item.metodo === 'PUT').length, 2);
});

test('429 com Retry-After atualiza a espera e exibe aviso global', async () => {
  let agora = Date.now();
  vi.spyOn(Date, 'now').mockImplementation(() => agora);
  const chamadas = simularApi(() => Response.json({ codigo: 'LIMITE_REQUISICOES_ATINGIDO', erro: 'Aguarde 25 segundos.' }, { status: 429, headers: { 'Retry-After': '25' } }));
  await renderizar(Aviso);
  await act(async () => { await assert.rejects(() => api.requisitar('/administracao/convites', { method: 'POST' }), /25 segundos/); });
  assert.match(document.querySelector('[role="alert"]').textContent, /25 segundos/);
  agora += 11000;
  await act(async () => { await assert.rejects(() => api.requisitar('/administracao/convites', { method: 'POST' }), /14 segundos/); });
  assert.equal(chamadas.length, 1);
  await clicar('Fechar aviso de espera');
  assert.equal(document.querySelector('[role="alert"]'), null);
});
