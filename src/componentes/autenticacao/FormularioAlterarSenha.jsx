import { useState } from 'react';
import CampoSenha from './CampoSenha';
import { alterarSenhaAutenticado } from '../../servicos/servicoAutenticacao';

export default function FormularioAlterarSenha({ desabilitado, aoConcluir }) {
  const [dados, setDados] = useState({ senhaAtual: '', novaSenha: '', confirmacaoSenha: '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (salvando || desabilitado) return;
    setErro('');
    if (dados.novaSenha.length < 8) { setErro('Informe uma senha válida.'); return; }
    if (dados.novaSenha !== dados.confirmacaoSenha) { setErro('A confirmação deve ser igual à nova senha.'); return; }
    setSalvando(true);
    try {
      await alterarSenhaAutenticado(dados);
      setDados({ senhaAtual: '', novaSenha: '', confirmacaoSenha: '' });
      aoConcluir();
    } catch (falha) { setErro(falha.message || 'Não foi possível alterar a senha.'); }
    finally { setSalvando(false); }
  }

  return <section className="alteracao-senha" aria-labelledby="alteracao-senha-titulo">
    <h2 id="alteracao-senha-titulo">Alterar senha</h2>
    <p>Confirme sua senha atual. Após a alteração, entre novamente com a nova senha.</p>
    {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
    <form className="formulario-publico" onSubmit={enviar}>
      {['senhaAtual', 'novaSenha', 'confirmacaoSenha'].map((campo, indice) => <CampoSenha key={campo}
        rotulo={['Senha atual', 'Nova senha', 'Confirmar nova senha'][indice]} required
        autoComplete={indice === 0 ? 'current-password' : 'new-password'} validarPolitica={indice !== 0}
        minLength={indice === 0 ? undefined : 8} value={dados[campo]} disabled={desabilitado || salvando}
        onChange={(evento) => setDados((atuais) => ({ ...atuais, [campo]: evento.target.value }))} />)}
      <button className="botao-destaque" disabled={desabilitado || salvando}>{salvando ? 'Salvando...' : 'Alterar senha'}</button>
    </form>
  </section>;
}
