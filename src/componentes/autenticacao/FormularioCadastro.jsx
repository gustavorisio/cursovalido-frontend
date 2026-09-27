import { Link } from 'react-router-dom';

export default function FormularioCadastro({ dados, idade, mensagemCep, carregandoCep, carregando, formularioValido, onAlterar, onEnviar, erro }) {
  return (
    <form onSubmit={onEnviar} className="formulario-publico formulario-cadastro">
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      <fieldset><legend>Dados pessoais</legend><div className="grade-formulario">
        <label>Nome completo<input required value={dados.nomeCompleto} onChange={(evento) => onAlterar('nomeCompleto', evento.target.value)} /></label>
        <label>E-mail<input required type="email" value={dados.email} onChange={(evento) => onAlterar('email', evento.target.value)} /></label>
        <label>Senha<input required minLength={8} type="password" value={dados.senha} onChange={(evento) => onAlterar('senha', evento.target.value)} /></label>
        <label>CPF<input required value={dados.cpf} onChange={(evento) => onAlterar('cpf', evento.target.value)} /></label>
        <label>Data de nascimento<input required type="date" value={dados.dataNascimento} onChange={(evento) => onAlterar('dataNascimento', evento.target.value)} />{dados.dataNascimento && idade < 18 && <small className="erro-campo">A plataforma Curso Válido é exclusiva para maiores de 18 anos.</small>}</label>
        <label>Telefone<input required value={dados.telefone} onChange={(evento) => onAlterar('telefone', evento.target.value)} /></label>
      </div></fieldset>
      <fieldset><legend>Endereço</legend><div className="grade-formulario">
        <label>CEP<input required value={dados.cep} onChange={(evento) => onAlterar('cep', evento.target.value)} />{mensagemCep && <small className={carregandoCep ? '' : 'texto-suave'}>{mensagemCep}</small>}</label>
        <label>Logradouro<input required value={dados.logradouro} onChange={(evento) => onAlterar('logradouro', evento.target.value)} /></label>
        <label>Bairro<input required value={dados.bairro} onChange={(evento) => onAlterar('bairro', evento.target.value)} /></label>
        <label>Cidade<input required value={dados.cidade} onChange={(evento) => onAlterar('cidade', evento.target.value)} /></label>
        <label>Estado<input required maxLength={2} value={dados.estado} onChange={(evento) => onAlterar('estado', evento.target.value.toUpperCase())} /></label>
      </div></fieldset>
      <label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => onAlterar('declarouMaiorIdade', evento.target.checked)} />Declaro que tenho 18 anos ou mais.</label>
      <label className="checkbox"><input type="checkbox" checked={dados.aceitouTermosLgpd} onChange={(evento) => onAlterar('aceitouTermosLgpd', evento.target.checked)} />Li e aceito os <Link to="/termos-aceite.html">Termos de Aceite</Link> e a <Link to="/politica-privacidade.html">Política de Privacidade</Link>.</label>
      <button className="botao-destaque" disabled={!formularioValido || carregando || carregandoCep}>{carregando ? 'Cadastrando...' : 'Cadastrar'}</button>
    </form>
  );
}
