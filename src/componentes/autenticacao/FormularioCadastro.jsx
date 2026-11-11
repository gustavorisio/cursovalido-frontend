import { validarCpf } from '../../paginas/validacoesCadastro';
import { Link } from 'react-router-dom';

export default function FormularioCadastro({ dados, idade, carregando, formularioValido, onAlterar, onEnviar, erro }) {
  return (
    <form onSubmit={onEnviar} className="formulario-publico formulario-cadastro">
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      <fieldset><legend>Dados pessoais</legend><div className="grade-formulario">
        <label>Nome completo<input required value={dados.nomeCompleto} onChange={(evento) => onAlterar('nomeCompleto', evento.target.value)} /></label>
        <label>E-mail<input required type="email" value={dados.email} onChange={(evento) => onAlterar('email', evento.target.value)} /></label>
        <label>Senha<input required minLength={8} type="password" value={dados.senha} onChange={(evento) => onAlterar('senha', evento.target.value)} /></label>
        <label>CPF<input required inputMode="numeric" maxLength={14} value={dados.cpf} onChange={(evento) => onAlterar('cpf', evento.target.value)} />{dados.cpf && !validarCpf(dados.cpf) && <small className="erro-campo" role="status">Informe um CPF válido.</small>}</label>
        <label>Data de nascimento<input required type="date" value={dados.dataNascimento} onChange={(evento) => onAlterar('dataNascimento', evento.target.value)} />{dados.dataNascimento && idade < 18 && <small className="erro-campo">A plataforma Curso Válido é destinada a pessoas com 18 anos ou mais.</small>}</label>
      </div></fieldset>
      <p className="texto-suave">Ao enviar o cadastro, seu CPF será consultado pela CPF.CNPJ para conferir a data de nascimento e a idade mínima de 18 anos. Você continuará nesta página.</p>
      <label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => onAlterar('declarouMaiorIdade', evento.target.checked)} />Declaro que tenho 18 anos ou mais.</label>
      <label className="checkbox"><input type="checkbox" checked={dados.aceitouTermosLgpd} onChange={(evento) => onAlterar('aceitouTermosLgpd', evento.target.checked)} />Li e aceito os <Link to="/termos-aceite.html">Termos de Aceite</Link> e a <Link to="/politica-privacidade.html">Política de Privacidade</Link>.</label>
      <button className="botao-destaque" disabled={!formularioValido || carregando}>{carregando ? 'Verificando dados e cadastrando...' : 'Cadastrar'}</button>
    </form>
  );
}
