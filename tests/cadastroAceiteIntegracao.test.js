import { Buffer } from 'node:buffer';
import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement as h, act, useState } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

let servidor, createRoot, Cadastro, Convite, Reativacao, Privacidade, Documento, Configuracoes, RotaProtegida, Login, Contexto, dom, raiz;
const fetchOriginal = globalThis.fetch;
const documentos = {
  termos: { versao: '1.0', conteudo: '<h1>Termos de Aceite</h1><p>Condições <strong>obrigatórias</strong>.</p><ol><li>Primeira condição</li></ol>' },
  privacidade: { versao: '2.0', conteudo: '<h1>Política de Privacidade</h1><p>Tratamento de <em>dados pessoais</em>.</p><ul><li>Seus direitos</li></ul>' }
};

before(async () => {
  const inicial = new JSDOM('<div></div>');
  globalThis.window = inicial.window;
  globalThis.document = inicial.window.document;
  ({ createRoot } = await import('react-dom/client'));
  servidor = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, logLevel: 'silent' });
  Cadastro = (await servidor.ssrLoadModule('/src/paginas/Cadastro.jsx')).default;
  Convite = (await servidor.ssrLoadModule('/src/paginas/CadastroConvite.jsx')).default;
  Reativacao = (await servidor.ssrLoadModule('/src/paginas/TermosDeUso.jsx')).default;
  Privacidade = (await servidor.ssrLoadModule('/src/paginas/PoliticaDePrivacidade.jsx')).default;
  Documento = (await servidor.ssrLoadModule('/src/componentes/comuns/DocumentoLegal.jsx')).default;
  Configuracoes = (await servidor.ssrLoadModule('/src/paginas/Configuracoes.jsx')).default;
  RotaProtegida = (await servidor.ssrLoadModule('/src/componentes/autenticacao/RotaProtegida.jsx')).default;
  Login = (await servidor.ssrLoadModule('/src/paginas/Login.jsx')).default;
  Contexto = (await servidor.ssrLoadModule('/src/contextos/contextoBaseAutenticacao.js')).AutenticacaoContexto;
  inicial.window.close();
});
after(async () => servidor?.close());
beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000', pretendToBeVisual: true });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage, IS_REACT_ACT_ENVIRONMENT: true });
  raiz = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(() => raiz.unmount());
  dom.window.close();
  globalThis.fetch = fetchOriginal;
  for (const chave of ['window', 'document', 'localStorage', 'sessionStorage', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[chave];
});

const botao = (texto) => [...document.querySelectorAll('button')].find((elemento) => elemento.textContent === texto);
const aceite = () => document.querySelector('.aceite-documentos input[type=checkbox]');
const leitor = () => document.querySelector('.leitura-documento-texto');
const confirmarLeitura = () => document.querySelector('.leitura-documento .btn-primary');

for (const perfil of [null, 'ALUNO', 'PROFESSOR', 'ADMINISTRADOR']) {
  test(`consulta pública ${perfil ?? 'visitante'}: documento e rodapé únicos com o mesmo conteúdo`, async () => {
    globalThis.fetch = async url => Response.json(String(url).endsWith('/politicas/ativas') ? [documentos.termos] : documentos.privacidade);
    for (const [Pagina, tipo] of [[Reativacao, 'termos'], [Privacidade, 'privacidade']]) {
      await act(async () => raiz.render(h(MemoryRouter, null,
        h(Contexto.Provider, { value: { autenticado: Boolean(perfil), sessao: perfil ? { perfil } : null, sair() {} } }, h(Pagina)))));
      assert.equal(document.querySelectorAll('.site-footer').length, 1);
      assert.equal(document.querySelectorAll('.documento-conteudo').length, 1);
      assert.equal(document.querySelectorAll('.conteudo-legal').length, 1);
      assert.equal(document.querySelector('.conteudo-legal h1').textContent, tipo === 'termos' ? 'Termos de Aceite' : 'Política de Privacidade');
      assert.equal(document.querySelector('.aceite-documentos'), null);
      assert.equal(document.querySelectorAll('.site-footer a').length, 3);
      await act(() => raiz.render(null));
    }
  });
}

for (const { fluxo, perfil } of [
  { fluxo: 'cadastro comum', perfil: 'ALUNO' },
  ...['PROFESSOR', 'ADMINISTRADOR'].map(perfil => ({ fluxo: 'cadastro por convite', perfil })),
  ...['ALUNO', 'PROFESSOR', 'ADMINISTRADOR'].map(perfil => ({ fluxo: 'reativação', perfil }))
]) {
  test(`${fluxo} ${perfil}: mesmos documentos das páginas públicas e envio bloqueado até aceitar os documentos, sem rolagem`, async () => {
    const referencias = {};
    for (const tipo of ['termos', 'privacidade']) {
      await act(() => raiz.render(h(MemoryRouter, null, h(Documento, { tipo, ...documentos[tipo] }))));
      referencias[tipo] = document.querySelector('.conteudo-legal').outerHTML;
    }
    await act(() => raiz.render(null));

    const tipos = perfil === 'ALUNO' ? ['termos', 'privacidade'] : ['termos', 'privacidade', 'responsabilidade'];
    const responsabilidade = { perfil, versao: '3.0', conteudo: 'Responsabilidades de ' + perfil };
    const envios = [];
    let falharPrivacidade = true;
    let falharResponsabilidade = true;
    globalThis.fetch = async (url, opcoes = {}) => {
      if (String(url).endsWith('/politicas/ativas')) return Response.json([documentos.termos]);
      if (String(url).endsWith('/politicas/privacidade/ativa')) {
        if (falharPrivacidade) { falharPrivacidade = false; return Response.json({ mensagem: 'Indisponível' }, { status: 503 }); }
        return Response.json(documentos.privacidade);
      }
      if (String(url).endsWith('/convites/consultar')) return Response.json({ perfil, email: 'aluno@example.com' });
      if (String(url).endsWith('/politicas/responsabilidade/' + perfil)) {
        if (falharResponsabilidade) { falharResponsabilidade = false; return Response.json({}, { status: 503 }); }
        return Response.json(responsabilidade);
      }
      if (String(url).endsWith('/convites/confirmar-email')) return new Response(null, { status: 204 });
      assert.equal(opcoes.method, 'POST');
      envios.push({ url: String(url), corpo: JSON.parse(opcoes.body) });
      return new Response(null, { status: 204 });
    };

    const reativacao = fluxo === 'reativação';
    if (reativacao) sessionStorage.setItem('curso-valido-token-termos', 'header.' + Buffer.from(JSON.stringify({ perfil, exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url') + '.assinatura');
    const Pagina = reativacao ? Reativacao : fluxo === 'cadastro por convite' ? Convite : Cadastro;
    await act(async () => raiz.render(h(MemoryRouter, { initialEntries: [fluxo === 'cadastro por convite' ? '/convites/cadastro?token=convite-teste' : '/'] },
      h(Contexto.Provider, { value: { autenticado: false, sair() {} } }, h(Pagina)))));
    if (fluxo === 'cadastro por convite') await act(async () => botao('Confirmar meu e-mail').click());

    const textoFinal = reativacao ? 'Aceitar termos e voltar ao login' : fluxo === 'cadastro por convite' ? 'Enviar cadastro' : 'Cadastrar';
    if (!reativacao) {
      const valores = ['Aluno Teste', 'aluno@example.com', 'SenhaTeste123!', '1990-01-01'];
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      for (const [indice, campo] of [...document.querySelectorAll('form input:not([type=checkbox])')].entries()) {
        await act(() => { setter.call(campo, valores[indice]); campo.dispatchEvent(new window.Event('input', { bubbles: true })); });
      }
      await act(() => document.querySelector('form input[type=checkbox]').click());
    }

    async function verificarEnvioBloqueado() {
      assert.equal(botao(textoFinal).disabled, true);
      await act(async () => {
        if (reativacao) botao(textoFinal).click();
        else document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
      });
      assert.equal(envios.length, 0);
      assert.equal(aceite().checked, false);
    }
    await verificarEnvioBloqueado();
    await act(async () => aceite().click());

    assert.equal(document.querySelectorAll('.site-footer').length, 1);
    assert.equal(document.querySelector('.documento-conteudo'), null);

    for (const tipo of tipos) {
      if (tipo === 'privacidade' || tipo === 'responsabilidade') {
        assert.equal(leitor(), null);
        assert.equal(confirmarLeitura().disabled, true);
        await verificarEnvioBloqueado();
        await act(async () => botao('Tentar novamente').click());
      }
      if (tipo === 'responsabilidade') assert.equal(leitor().textContent, responsabilidade.conteudo);
      else assert.equal(leitor().querySelector('.conteudo-legal').outerHTML, referencias[tipo]);
      assert.equal(document.querySelectorAll('.conteudo-legal').length, 1, 'somente o documento em leitura deve ser renderizado');
      assert.equal(document.querySelector('iframe'), null);
      assert.equal(leitor().scrollTop, 0);
      assert.equal(confirmarLeitura().disabled, false);
      await verificarEnvioBloqueado();
      await act(async () => confirmarLeitura().click());
    }
    assert.equal(aceite().checked, true);
    assert.equal(botao(textoFinal).disabled, false);

    if (reativacao) {
      // Consultar a política pelo rodapé não deve desmontar nem perder os aceites.
      const linkPrivacidade = [...document.querySelectorAll('.site-footer a')].find(link => link.textContent === 'Política de Privacidade');
      await act(async () => linkPrivacidade.click());
      assert.equal(document.querySelector('.aceite-documentos').closest('[hidden]') !== null, true);
      assert.equal(document.querySelector('.documento-conteudo .conteudo-legal').outerHTML, referencias.privacidade);
      await act(async () => botao('Termos de Aceite').click());
      assert.equal(document.querySelector('.aceite-documentos').closest('[hidden]'), null);
      assert.equal(document.querySelector('.documento-conteudo'), null);
      assert.equal(aceite().checked, true);
      assert.equal(botao(textoFinal).disabled, false);
    }

    // Desmarcar o aceite exige confirmar novamente os documentos.
    await act(() => aceite().click());
    await verificarEnvioBloqueado();
    await act(async () => aceite().click());
    for (const tipo of tipos) {
      if (tipo === 'responsabilidade') assert.equal(leitor().textContent, responsabilidade.conteudo);
      else assert.equal(leitor().querySelector('.conteudo-legal').outerHTML, referencias[tipo]);
      assert.equal(confirmarLeitura().disabled, false);
      await act(async () => confirmarLeitura().click());
    }
    assert.equal(botao(textoFinal).disabled, false);
    await act(async () => botao(textoFinal).click());
    assert.equal(envios.length, 1);
    const envio = envios[0];
    assert.ok(envio.url.endsWith(reativacao ? '/autenticacao/aceitar-termos-novamente' : fluxo === 'cadastro por convite' ? '/convites/completar-cadastro' : '/autenticacao/cadastro'));
    const dados = envio.corpo.cadastro ?? envio.corpo;
    assert.equal(dados.versaoTermos, '1.0');
    if (perfil !== 'ALUNO') {
      assert.equal(dados.aceitouResponsabilidade, true);
      assert.equal(dados.versaoResponsabilidade, '3.0');
    } else assert.equal(dados.aceitouResponsabilidade, undefined);
    if (!reativacao) assert.equal(dados.aceitouTermosLgpd, true);
    else assert.equal(sessionStorage.getItem('curso-valido-token-termos'), null);
  });
}


test('convite sem perfil válido bloqueia confirmação e não permite cadastro', async () => {
  const chamadas = [];
  globalThis.fetch = async (url) => {
    chamadas.push(String(url));
    if (String(url).endsWith('/politicas/ativas')) return Response.json([documentos.termos]);
    return Response.json({ email: 'aluno@example.com', perfil: 'ALUNO' });
  };
  await act(async () => raiz.render(h(MemoryRouter, { initialEntries: ['/convites/cadastro?token=invalido'] }, h(Convite))));
  await act(async () => botao('Confirmar meu e-mail').click());
  assert.equal(document.querySelector('form'), null);
  assert.match(document.querySelector('[role=alert]').textContent, /perfil do convite/);
  assert.equal(chamadas.some(url => url.endsWith('/convites/confirmar-email')), false);
});

test('primeiro acesso sem perfil identificável não libera envio', async () => {
  sessionStorage.setItem('curso-valido-token-termos', 'token-invalido');
  globalThis.fetch = async () => Response.json([documentos.termos]);
  await act(async () => raiz.render(h(MemoryRouter, null,
    h(Contexto.Provider, { value: { autenticado: false, sair() {} } }, h(Reativacao)))));
  assert.match(document.querySelector('[role=alert]').textContent, /identificar seu perfil/);
  assert.equal(botao('Aceitar termos e voltar ao login').disabled, true);
});

test('recarregar documentos após rejeição invalida todos os aceites mesmo com a mesma versão', async () => {
  const perfil = 'PROFESSOR';
  sessionStorage.setItem('curso-valido-token-termos', 'header.' + Buffer.from(JSON.stringify({ perfil })).toString('base64url') + '.assinatura');
  globalThis.fetch = async (url, opcoes = {}) => {
    if (opcoes.method === 'POST') return Response.json({}, { status: 400 });
    if (String(url).endsWith('/politicas/ativas')) return Response.json([documentos.termos]);
    if (String(url).endsWith('/politicas/privacidade/ativa')) return Response.json(documentos.privacidade);
    return Response.json({ perfil, versao: '3.0', conteudo: 'Responsabilidades do professor' });
  };
  await act(async () => raiz.render(h(MemoryRouter, null,
    h(Contexto.Provider, { value: { autenticado: false, sair() {} } }, h(Reativacao)))));
  await act(async () => aceite().click());
  for (let indice = 0; indice < 3; indice++) {
    await act(async () => confirmarLeitura().click());
  }
  await act(async () => botao('Aceitar termos e voltar ao login').click());
  assert.match(document.querySelector('[role=alert]').textContent, /Busque novamente/);
  await act(async () => botao('Buscar novamente').click());
  assert.equal(aceite().checked, false);
  assert.equal(botao('Aceitar termos e voltar ao login').disabled, true);
  assert.equal(botao('Política de Privacidade — Aceito'), undefined);
  assert.equal(botao('Termo de Responsabilidade — Aceito'), undefined);
  await act(async () => aceite().click());
  assert.equal(confirmarLeitura().disabled, false);
  await act(async () => confirmarLeitura().click());
  assert.equal(botao('Aceitar termos e voltar ao login').disabled, true);
  assert.equal(document.querySelector('.leitura-documento h3').textContent, 'Política de Privacidade');
});

for (const perfil of ['ALUNO', 'PROFESSOR', 'ADMINISTRADOR']) {
  test(`revogação ${perfil}: cancelamento preserva conta e saída assíncrona mantém o aviso no login`, async () => {
    let finalizarSaida;
    const saida = new Promise(resolve => { finalizarSaida = resolve; });
    let revogacoes = 0;
    globalThis.fetch = async (url) => {
      if (String(url).endsWith('/autenticacao/revogar-termos')) {
        revogacoes++;
        return new Response(null, { status: 204 });
      }
      return Response.json({ id: 1, perfil, email: 'teste@example.test', nomeCompleto: 'Conta de teste' });
    };
    function Aplicacao() {
      const [autenticado, setAutenticado] = useState(true);
      return h(Contexto.Provider, { value: { autenticado, sessao: { perfil }, sair() { setAutenticado(false); return saida; } } },
        h(Routes, null,
          h(Route, { element: h(RotaProtegida) }, h(Route, { path: '/configuracoes', element: h(Configuracoes) })),
          h(Route, { path: '/login', element: h(Login) })));
    }
    await act(async () => raiz.render(h(MemoryRouter, { initialEntries: ['/configuracoes'] }, h(Aplicacao))));
    await act(() => botao('Revogar aceite dos termos').click());
    await act(() => botao('Cancelar').click());
    assert.equal(revogacoes, 0);
    assert.equal(document.querySelector('h1').textContent, 'Configurações da conta');
    await act(() => botao('Revogar aceite dos termos').click());
    await act(async () => botao('Confirmar').click());
    assert.equal(revogacoes, 1);
    assert.equal(document.querySelector('h1').textContent, 'Entrar na plataforma');
    await act(async () => finalizarSaida());
    assert.match(document.querySelector('[role=status]').textContent, /Os termos foram revogados/);
  });
}
