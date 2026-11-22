import { test, vi } from 'vitest';
import assert from 'node:assert/strict';
import { prepararTela, clicar, preencher } from './apoio/tela.js';

let Formulario;
const { renderizar } = prepararTela(async (carregar) => {
  Formulario = (await carregar('componentes/forum/componentes/FormularioDenuncia.jsx')).default;
});

test('formulário mantém motivo e relato e permite cancelar sem publicar', async () => {
  const enviar = vi.fn(); const cancelar = vi.fn();
  await renderizar(Formulario, { props: { aoEnviar: enviar, aoCancelar: cancelar } });
  assert.equal(document.querySelector('select').value, 'CONTEUDO_IMPROPRIO');
  assert.equal(document.querySelectorAll('option').length, 7);
  assert.equal(document.querySelector('textarea').maxLength, 1000);
  await preencher('select', 'DADOS_PESSOAIS');
  await preencher('textarea', 'Estão expondo dados pessoais.');
  assert.equal(document.querySelector('select').value, 'DADOS_PESSOAIS');
  assert.equal(document.querySelector('textarea').value, 'Estão expondo dados pessoais.');
  await clicar('Cancelar');
  assert.equal(cancelar.mock.calls.length, 1);
  assert.equal(enviar.mock.calls.length, 0);
});
