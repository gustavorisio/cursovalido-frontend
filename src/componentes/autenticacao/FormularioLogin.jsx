import CampoSenha from './CampoSenha';
import { Link } from 'react-router-dom';
import { LIMITES } from '../../servicos/validacoesAutenticacao';

export default function FormularioLogin({ codigo, segundoFator, finalidadeCodigo, erro, carregando, mensagem, onCodigo, onEnviar }) {
  return (
    <>
      {mensagem && <div className="mensagem-sucesso" role="status">{mensagem}</div>}
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      {!segundoFator ? <form onSubmit={onEnviar} className="formulario-publico" noValidate>
        <label>E-mail<input required name="email" type="email" autoComplete="username" maxLength={LIMITES.email} /></label>
        <CampoSenha required name="senha" autoComplete="current-password" validarPolitica={false} maxLength={LIMITES.senha} />
        <button className="botao-destaque" disabled={carregando}>{carregando ? 'Entrando...' : 'Entrar'}</button>
      </form> : <form onSubmit={onEnviar} className="formulario-publico" noValidate>
        <p className="texto-suave">{finalidadeCodigo === 'CONFIRMAR_EMAIL' ? 'Confirme seu e-mail com o código de 6 dígitos que enviamos.' : 'Enviamos um código de 6 dígitos para o seu e-mail para concluir o login.'}</p>
        <label>Código de validação<input required autoFocus name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={LIMITES.codigo} value={codigo} onChange={(evento) => onCodigo(evento.target.value.replace(/\D/g, ''))} /></label>
        <button className="botao-destaque" disabled={carregando}>{carregando ? 'Validando...' : 'Validar código'}</button>
      </form>}
      <p className="texto-rodape-formulario"><Link to="/solicitar-alteracao-senha">Esqueci minha senha</Link></p>
    </>
  );
}
