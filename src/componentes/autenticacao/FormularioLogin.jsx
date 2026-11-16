import CampoSenha from './CampoSenha';
import { Link } from 'react-router-dom';

export default function FormularioLogin({ codigo, segundoFator, erro, carregando, mensagem, onCodigo, onEnviar }) {
  return (
    <>
      {mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      {!segundoFator ? <form onSubmit={onEnviar} className="formulario-publico">
        <label>E-mail<input required name="email" type="email" autoComplete="username" /></label>
        <CampoSenha required name="senha" autoComplete="current-password" validarPolitica={false} />
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
