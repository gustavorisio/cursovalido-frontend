import test, { before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createElement as h, act } from 'react';
import { MemoryRouter } from 'react-router-dom';

let servidor, createRoot, Cadastro, Convite, Reativacao, Documento, Contexto, dom, raiz;
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
  Documento = (await servidor.ssrLoadModule('/src/componentes/comuns/DocumentoLegal.jsx')).default;
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

async function rolar(elemento, posicao) {
  elemento.scrollTop = posicao;
  await act(() => elemento.dispatchEvent(new window.Event('scroll', { bubbles: true })));
}

for (const fluxo of ['cadastro comum', 'cadastro por convite', 'reativação']) {
  test(`${fluxo}: mesmos documentos das páginas públicas e envio bloqueado até ler e aceitar ambos`, async () => {
    const referencias = {};
    for (const tipo of ['termos', 'privacidade']) {
      await act(() => raiz.render(h(MemoryRouter, null, h(Documento, { tipo, ...documentos[tipo] }))));
      referencias[tipo] = document.querySelector('.conteudo-legal').outerHTML;
    }
    await act(() => raiz.render(null));

    const envios = [];
    let falharPrivacidade = true;
    globalThis.fetch = async (url, opcoes = {}) => {
      if (String(url).endsWith('/politicas/ativas')) return Response.json([documentos.termos]);
      if (String(url).endsWith('/politicas/privacidade/ativa')) {
        if (falharPrivacidade) { falharPrivacidade = false; return Response.json({ mensagem: 'Indisponível' }, { status: 503 }); }
        return Response.json(documentos.privacidade);
      }
      if (String(url).endsWith('/convites/confirmar-email')) return new Response(null, { status: 204 });
      assert.equal(opcoes.method, 'POST');
      envios.push({ url: String(url), corpo: JSON.parse(opcoes.body) });
      return new Response(null, { status: 204 });
    };

    const reativacao = fluxo === 'reativação';
    if (reativacao) sessionStorage.setItem('curso-valido-token-termos', 'token-pendente');
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

    for (const tipo of ['termos', 'privacidade']) {
      if (tipo === 'privacidade') {
        assert.equal(leitor(), null);
        assert.equal(confirmarLeitura().disabled, true);
        await verificarEnvioBloqueado();
        await act(async () => botao('Tentar novamente').click());
      }
      assert.equal(leitor().querySelector('.conteudo-legal').outerHTML, referencias[tipo]);
      assert.equal(document.querySelector('iframe'), null);
      assert.equal(confirmarLeitura().disabled, true);
      Object.defineProperties(leitor(), { clientHeight: { value: 200 }, scrollHeight: { value: 1200 } });
      await act(() => window.dispatchEvent(new window.Event('scroll')));
      assert.equal(confirmarLeitura().disabled, true);
      await rolar(leitor(), 500);
      assert.equal(confirmarLeitura().disabled, true);
      await verificarEnvioBloqueado();
      await act(() => confirmarLeitura().click());
      assert.equal(confirmarLeitura().disabled, true);
      await rolar(leitor(), 1000);
      assert.equal(confirmarLeitura().disabled, false);
      // Chegar ao fim libera a confirmação do documento, mas não aceita por conta própria.
      await verificarEnvioBloqueado();
      await act(async () => confirmarLeitura().click());
    }
    assert.equal(aceite().checked, true);
    assert.equal(botao(textoFinal).disabled, false);

    // Revogar o aceite exige repetir a leitura dos dois documentos.
    await act(() => aceite().click());
    await verificarEnvioBloqueado();
    await act(async () => aceite().click());
    for (const tipo of ['termos', 'privacidade']) {
      assert.equal(leitor().querySelector('.conteudo-legal').outerHTML, referencias[tipo]);
      assert.equal(confirmarLeitura().disabled, true);
      Object.defineProperties(leitor(), { clientHeight: { value: 200 }, scrollHeight: { value: 1200 } });
      await rolar(leitor(), 1000);
      await act(async () => confirmarLeitura().click());
    }
    assert.equal(botao(textoFinal).disabled, false);
    await act(async () => botao(textoFinal).click());
    assert.equal(envios.length, 1);
    const envio = envios[0];
    assert.ok(envio.url.endsWith(reativacao ? '/autenticacao/aceitar-termos-novamente' : fluxo === 'cadastro por convite' ? '/convites/completar-cadastro' : '/autenticacao/cadastro'));
    const dados = envio.corpo.cadastro ?? envio.corpo;
    assert.equal(dados.versaoTermos, '1.0');
    if (!reativacao) assert.equal(dados.aceitouTermosLgpd, true);
    else assert.equal(sessionStorage.getItem('curso-valido-token-termos'), null);
  });
}
