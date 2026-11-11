import { Link } from 'react-router-dom';

export default function FormularioLogin({ dados, codigo, segundoFator, erro, carregando, mensagem, onAlterar, onCodigo, onEnviar }) {
  return (
    <>
      {mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      {!segundoFator ? <form onSubmit={onEnviar} className="formulario-publico">
        <label>E-mail<input required type="email" value={dados.email} onChange={(evento) => onAlterar('email', evento.target.value)} /></label>
        <label>Senha<input required minLength={8} type="password" value={dados.senha} onChange={(evento) => onAlterar('senha', evento.target.value)} /></label>
        <button className="botao-destaque" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
      </form> : <form onSubmit={onEnviar} className="formulario-publico">
        <p className="texto-suave">Enviamos um código de 6 dígitos para o seu e-mail.</p>
        <label>Código de validação<input required autoFocus inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={codigo} onChange={(evento) => onCodigo(evento.target.value.replace(/\D/g, ''))} /></label>
        <button className="botao-destaque" disabled={carregando}>{carregando ? 'Validando...' : 'Validar código'}</button>
      </form>}
      <p className="texto-rodape-formulario"><Link to="/solicitar-alteracao-senha">Esqueci minha senha</Link></p>
    </>
  );
}
