import { test } from 'vitest';
import assert from 'node:assert/strict';
import { prepararTela, clicar, preencher, simularApi } from './apoio/tela.js';

let Denuncias;
const { renderizar } = prepararTela(async (carregar) => {
  Denuncias = (await carregar('componentes/administracao/DenunciasForum.jsx')).default;
});

test('denúncias identificam autor por gamertag e exigem observação antes de decidir', async () => {
  const denuncia = { id: 1, tipo: 'TOPICO', motivo: 'OFENSA', nomeAutor: 'Ana S.', gamertagAutor: '#1a3b5c7d',
    idAutor: 7, trecho: 'Conteúdo denunciado', descricao: 'Relato de abuso', conteudoAtivo: true,
    denunciasPendentesDoConteudo: 2, status: 'PENDENTE', criadaEm: '2026-11-22T10:00:00' };
  const chamadas = simularApi(({ rota, metodo, busca }) => {
    assert.equal(rota, '/administracao/forum/denuncias');
    assert.equal(metodo, 'GET');
    return Response.json([{ ...denuncia, status: busca.get('status') || 'PENDENTE' }]);
  });
  await renderizar(Denuncias, { sessao: { idUsuario: 10, perfil: 'ADMINISTRADOR' } });
  const artigo = document.querySelector('article');
  assert.match(artigo.textContent, /Ana S\./);
  assert.match(artigo.textContent, /#1a3b5c7d/);
  assert.match(artigo.textContent, /2 denúncia/);
  await clicar('Aprovar denúncia');
  assert.match(document.querySelector('[role="alert"]').textContent, /Informe uma observação/);
  assert.equal(chamadas.some(item => item.metodo !== 'GET'), false);
  await preencher('textarea', 'Análise da moderação');
  assert.equal(document.querySelector('textarea').value, 'Análise da moderação');
  await preencher('select', 'PROCEDENTE');
  assert.equal(chamadas.at(-1).busca.get('status'), 'PROCEDENTE');
  assert.match(document.querySelector('article').textContent, /PROCEDENTE/);
});
