import CampoSenha from './CampoSenha';
import { limparNomeCompleto } from '../../paginas/validacoesCadastro';
import AceiteDocumentos from '../comuns/AceiteDocumentos';

export default function FormularioCadastro({ dados, idade, carregando, formularioValido, onAlterar, onEnviar, erro }) {
  return (
    <form onSubmit={onEnviar} className="formulario-publico formulario-cadastro">
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      <fieldset><legend>Dados pessoais</legend><div className="grade-formulario">
        <label>Nome completo<input required autoComplete="name" maxLength={120} value={dados.nomeCompleto} onChange={(evento) => onAlterar('nomeCompleto', limparNomeCompleto(evento.target.value))} /></label>
        <label>E-mail<input required type="email" value={dados.email} onChange={(evento) => onAlterar('email', evento.target.value)} /></label>
        <CampoSenha required value={dados.senha} onChange={(evento) => onAlterar('senha', evento.target.value)} />
        <CampoSenha rotulo="Confirmar senha" required validarPolitica={false} maxLength={72} value={dados.confirmacaoSenha} onChange={(evento) => onAlterar('confirmacaoSenha', evento.target.value)} />
        <label>Data de nascimento<input required type="date" value={dados.dataNascimento} onChange={(evento) => onAlterar('dataNascimento', evento.target.value)} />{dados.dataNascimento && idade > 90 && <small className="erro-campo">A idade máxima permitida é 90 anos.</small>}{dados.dataNascimento && idade < 18 && <small className="erro-campo">A plataforma Curso Válido é destinada a pessoas com 18 anos ou mais.</small>}</label>
      </div></fieldset>
      {dados.confirmacaoSenha && dados.senha !== dados.confirmacaoSenha && <p className="erro-campo" role="status">As senhas devem coincidir.</p>}
      <label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => onAlterar('declarouMaiorIdade', evento.target.checked)} />Declaro que tenho 18 anos ou mais.</label>
      <AceiteDocumentos key={dados.versaoTermos} versaoTermos={dados.versaoTermos} aceito={dados.aceitouTermosLgpd} desabilitado={carregando} onAlterar={(valor) => onAlterar('aceitouTermosLgpd', valor)} />
      <button className="botao-destaque" disabled={!formularioValido || carregando}>{carregando ? 'Cadastrando...' : 'Cadastrar'}</button>
    </form>
  );
}
