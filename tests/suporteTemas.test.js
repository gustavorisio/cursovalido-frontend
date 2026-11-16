import test from 'node:test';
import assert from 'node:assert/strict';
import { prepararTela, clicar, preencher, enviar, simularApi } from './apoio/tela.js';

let Suporte, GerenciarTemas;
const { renderizar } = prepararTela(async (carregar) => {
  Suporte = (await carregar('componentes/suporte/PaginaSuporte.jsx')).default;
  GerenciarTemas = (await carregar('componentes/aulas/componentes/GerenciarTemas.jsx')).default;
});

const pedido = {
  emailConta: 'aluno@example.com', usuario: 'Ana Silva', motivo: 'REVISAO_BANIMENTO',
  assunto: 'Acesso ao curso', descricao: 'Minha conta perdeu o acesso ao curso ontem.',
};

test('suporte valida os campos antes de enviar a solicitação', async (t) => {
  const chamadas = simularApi(t, () => Response.json({ protocolo: 'SUP-104' }));
  await renderizar(Suporte);
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /E-mail da conta/);

  await preencher('#emailConta', 'email-invalido');
  await preencher('#usuario', ' Ana Silva ');
  await preencher('#assunto', pedido.assunto);
  await preencher('#descricao', 'Sem acesso');
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /20 caracteres/);

  await preencher('#descricao', pedido.descricao);
  await enviar();
  assert.match(document.querySelector('[role="alert"]').textContent, /e-mail válido/);
  assert.equal(chamadas.length, 0);

  await preencher('#emailConta', pedido.emailConta);
  await enviar();
  assert.deepEqual(chamadas[0].dados, pedido);
  assert.match(document.querySelector('[role="status"]').textContent, /SUP-104/);
});

test('suporte mantém o formulário se a resposta não trouxer protocolo', async (t) => {
  simularApi(t, () => Response.json({}));
  await renderizar(Suporte);
  for (const campo of ['emailConta', 'usuario', 'assunto', 'descricao']) {
    await preencher('#' + campo, pedido[campo]);
  }
  await enviar();

  assert.match(document.querySelector('[role="alert"]').textContent, /Não foi possível confirmar/);
  assert.equal(document.querySelector('#descricao').value, pedido.descricao);
  assert.equal(document.querySelector('fieldset').disabled, false);
});

test('gestão cria e renomeia um tema e pede confirmação antes de excluir', async (t) => {
  const chamadas = simularApi(t, () => new Response(null, { status: 204 }));
  const onAtualizar = t.mock.fn();
  await renderizar(GerenciarTemas, { props: { temas: [{ id: 4, nome: 'Web' }], onAtualizar } });

  await preencher('#tema-nome', ' Dados ');
  await clicar('Criar tema');
  assert.equal(chamadas[0].metodo, 'POST');
  assert.deepEqual(chamadas[0].dados, { nome: 'Dados' });

  await clicar('Editar');
  assert.equal(document.querySelector('#tema-nome').value, 'Web');
  await preencher('#tema-nome', 'Desenvolvimento Web');
  await clicar('Salvar tema');
  assert.equal(chamadas[1].rota, '/temas/4');
  assert.equal(chamadas[1].metodo, 'PUT');

  await clicar('Excluir');
  await clicar('Cancelar', document.querySelector('[role="dialog"]'));
  assert.equal(chamadas.length, 2);
  await clicar('Excluir');
  await clicar('Confirmar');
  assert.equal(chamadas[2].metodo, 'DELETE');
  assert.equal(chamadas[2].rota, '/temas/4');
  assert.deepEqual(onAtualizar.mock.calls[2].arguments, [4]);
});
