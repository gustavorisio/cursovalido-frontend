import CabecalhoPagina from '../comuns/CabecalhoPagina';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Rodape from '../comuns/Rodape';
import { enviarSolicitacao } from './servicoSuporte';
import '../forum/forum.css';
import './suporte.css';

const inicial = { emailConta: '', usuario: '', emailContato: '', motivo: 'REVISAO_BANIMENTO', assunto: '', descricao: '' };
const motivos = [
  ['REVISAO_BANIMENTO', 'Revisão de banimento'], ['RECUPERACAO_CONTA', 'Recuperação de conta'],
  ['PROBLEMA_ACESSO', 'Problema de acesso'], ['ERRO_SISTEMA', 'Erro no sistema'],
  ['PRIVACIDADE', 'Privacidade e dados pessoais'], ['OUTROS', 'Outros assuntos'],
];

export default function PaginaSuporte() {
  const [dados, setDados] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const emAndamento = useRef(false);
  const aviso = useRef(null);
  function mostrarErro(mensagem) {
    setErro(mensagem);
    setTimeout(() => aviso.current?.focus(), 0);
  }
  function alterar(evento) {
    const { name, value } = evento.target;
    setDados((atual) => ({ ...atual, [name]: value }));
  }
  async function enviar(evento) {
    evento.preventDefault();
    if (emAndamento.current) return;
    const pedido = Object.fromEntries(Object.entries(dados).map(([chave, valor]) => [chave, valor.trim()]));
    const campoVazio = Object.keys(pedido).find((campo) => !pedido[campo]);
    if (campoVazio) {
      const nome = evento.currentTarget.elements.namedItem(campoVazio)?.labels?.[0]?.textContent || 'Campo';
      mostrarErro(`${nome}: preencha este campo.`);
      return;
    }
    if (pedido.descricao.length < 20) {
      mostrarErro('Descrição: escreva pelo menos 20 caracteres.');
      return;
    }
    const campoInvalido = [...evento.currentTarget.elements].find((campo) => campo.willValidate && !campo.validity.valid);
    if (campoInvalido) {
      const nome = campoInvalido.labels?.[0]?.textContent || 'Campo inválido';
      mostrarErro(`${nome}: ${campoInvalido.type === 'email' ? 'informe um e-mail válido.' : 'verifique o valor informado.'}`);
      return;
    }
    emAndamento.current = true;
    setEnviando(true); setErro('');
    try {
      const resposta = await enviarSolicitacao(pedido);
      if (!resposta?.protocolo) throw new Error('O servidor não confirmou o envio. Tente novamente.');
      setResultado(resposta);
    }
    catch (falha) { mostrarErro(falha.message || 'Não foi possível enviar. Tente novamente.'); }
    finally { emAndamento.current = false; setEnviando(false); }
  }
  return <div className="app-container pagina-forum pagina-suporte">
    <main className="main-content">
      <CabecalhoPagina titulo="Suporte" descricao="Recupere seu acesso ou fale com a nossa equipe. Você pode enviar uma solicitação sem entrar na conta." />
      <div className="forum-colunas">
        <section className="forum-topicos" aria-label="Solicitação de suporte">
          {resultado ? <div className="card" role="status" aria-live="polite">
            <h2>Solicitação enviada</h2><p>Guarde seu protocolo: <strong>{resultado.protocolo}</strong></p>
            <p>A equipe responderá pelo e-mail de contato informado. Confira também a caixa de spam.</p>
            <div className="suporte-acoes">
              <Link className="btn btn-secondary" to="/">Voltar ao início</Link>
            </div>
          </div> : <form className="card suporte-formulario" noValidate onSubmit={enviar} aria-busy={enviando}>
            <h2>Como podemos ajudar?</h2><p>Todos os campos são obrigatórios.</p>
            <fieldset disabled={enviando}>
              <label htmlFor="emailConta">E-mail da conta</label>
              <input className="input-field" id="emailConta" name="emailConta" type="email" autoComplete="email" maxLength={254} required value={dados.emailConta} onChange={alterar} />
              <label htmlFor="usuario">Nome de usuário ou nome cadastrado</label>
              <input className="input-field" id="usuario" name="usuario" autoComplete="username" maxLength={100} required value={dados.usuario} onChange={alterar} />
              <label htmlFor="emailContato">E-mail para receber a resposta</label>
              <input className="input-field" id="emailContato" name="emailContato" type="email" maxLength={254} required aria-describedby="contato-ajuda" value={dados.emailContato} onChange={alterar} />
              <p id="contato-ajuda">Informe um e-mail ao qual você tenha acesso, mesmo que seja diferente do e-mail da conta.</p>
              <label htmlFor="motivo">Motivo do contato</label>
              <select className="input-field" id="motivo" name="motivo" value={dados.motivo} onChange={alterar}>{motivos.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select>
              <label htmlFor="assunto">Assunto</label>
              <input className="input-field" id="assunto" name="assunto" maxLength={150} required value={dados.assunto} onChange={alterar} />
              <label htmlFor="descricao">Descreva o que aconteceu</label>
              <textarea className="input-field" id="descricao" name="descricao" rows={8} minLength={20} maxLength={5000} required aria-describedby="descricao-ajuda" value={dados.descricao} onChange={alterar} />
              <p id="descricao-ajuda">Use entre 20 e 5.000 caracteres. Informe quando o problema começou e qual mensagem apareceu. Não envie senhas, códigos de acesso, CPF ou documentos.</p>
              <div className="contador">{dados.descricao.length}/5000</div>
            </fieldset>
            <div className="suporte-envio">
              <p>Seus dados serão enviados à equipe para atender esta solicitação. <Link to="/politica-privacidade.html">Política de Privacidade</Link>.</p>
              {erro && <p ref={aviso} tabIndex={-1} className="mensagem-erro suporte-erro" role="alert">{erro}</p>}
              {enviando && <p role="status">Enviando sua solicitação. Aguarde a confirmação.</p>}
              <div className="suporte-acoes"><button className="btn btn-primary" type="submit" disabled={enviando}>{enviando ? 'Enviando...' : 'Enviar solicitação'}</button></div>
            </div>
          </form>}
        </section>
        <aside className="forum-regras" aria-labelledby="suporte-orientacoes"><h2 id="suporte-orientacoes">Antes de enviar</h2>
          <ul><li>Para contestar um banimento, explique por que acredita que houve um erro.</li>
            <li>Para recuperar a conta, informe os dados que usava na plataforma.</li>
            <li>É permitido enviar uma solicitação a cada 24 horas por IP ou e-mail. Guarde o protocolo para acompanhar seu contato.</li></ul>
          <p>Esqueceu sua senha? <Link to="/solicitar-alteracao-senha">Redefinir senha</Link>.</p>
          <p>A equipe analisará seu caso. O envio não altera automaticamente o acesso à conta.</p>
        </aside>
      </div>
    </main><Rodape />
  </div>;
}
