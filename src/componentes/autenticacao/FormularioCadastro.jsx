import CampoSenha from './CampoSenha';
import { limparNomeCompleto } from '../../paginas/validacoesCadastro';
import AceiteDocumentos from '../comuns/AceiteDocumentos';
import { LIMITES } from '../../servicos/validacoesAutenticacao';

export default function FormularioCadastro({ dados, carregando, formularioValido, onAlterar, onEnviar, erro }) {
  const erroConfirmacao = dados.confirmacaoSenha && dados.senha !== dados.confirmacaoSenha
    ? 'As senhas devem coincidir.'
    : '';
  return (
    <form onSubmit={onEnviar} className="formulario-publico formulario-cadastro" noValidate>
      {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
      <fieldset><legend>Dados pessoais</legend><div className="grade-formulario">
        <label>Nome completo<input required autoComplete="name" maxLength={LIMITES.nome} value={dados.nomeCompleto} onChange={(evento) => onAlterar('nomeCompleto', limparNomeCompleto(evento.target.value))} /></label>
        <label>E-mail<input required type="email" autoComplete="email" maxLength={LIMITES.email} value={dados.email} onChange={(evento) => onAlterar('email', evento.target.value)} /></label>
        <CampoSenha required value={dados.senha} onChange={(evento) => onAlterar('senha', evento.target.value)} />
        <CampoSenha rotulo="Confirmar senha" required validarPolitica={false} maxLength={72} erro={erroConfirmacao} value={dados.confirmacaoSenha} onChange={(evento) => onAlterar('confirmacaoSenha', evento.target.value)} />
      </div></fieldset>
      <label className="checkbox"><input type="checkbox" checked={dados.declarouMaiorIdade} onChange={(evento) => onAlterar('declarouMaiorIdade', evento.target.checked)} />Declaro que tenho 18 anos ou mais.</label>
      <AceiteDocumentos key={dados.versaoTermos} versaoTermos={dados.versaoTermos} aceito={dados.aceitouTermosLgpd} desabilitado={carregando} onAlterar={(valor) => onAlterar('aceitouTermosLgpd', valor)} />
      <button className="botao-destaque" disabled={carregando} aria-disabled={!formularioValido}>{carregando ? 'Cadastrando...' : 'Cadastrar'}</button>
    </form>
  );
}
