import { useState } from 'react';
import CampoSenha from './CampoSenha';
import { alterarSenhaAutenticado } from '../../servicos/servicoAutenticacao';
import { useAcaoUnica } from '../../contextos/useAcaoUnica';
import { validarNovaSenha } from '../../servicos/validacoesAutenticacao';

export default function FormularioAlterarSenha({ desabilitado, aoConcluir }) {
  const [dados, setDados] = useState({ senhaAtual: '', novaSenha: '', confirmacaoSenha: '' });
  const [erro, setErro] = useState('');
  const [executar, salvando] = useAcaoUnica();

  async function enviar(evento) {
    evento.preventDefault();
    if (salvando || desabilitado) return;
    setErro('');
    if (!dados.senhaAtual) { setErro('Informe sua senha atual.'); return; }
    const problema = validarNovaSenha(dados.novaSenha, dados.confirmacaoSenha, { rotulo: 'a nova senha', rotuloConfirmacao: 'Confirme a nova senha.' });
    if (problema) { setErro(problema === 'A confirmação deve ser igual à senha.' ? 'A confirmação deve ser igual à nova senha.' : problema); return; }
    if (dados.senhaAtual === dados.novaSenha) { setErro('A nova senha deve ser diferente da senha atual.'); return; }
    await executar(async () => {
      try {
        await alterarSenhaAutenticado(dados);
        setDados({ senhaAtual: '', novaSenha: '', confirmacaoSenha: '' });
        aoConcluir();
      } catch (falha) { setErro(falha.message || 'Não foi possível alterar a senha.'); }
    });
  }

  return <section className="alteracao-senha" aria-labelledby="alteracao-senha-titulo">
    <h2 id="alteracao-senha-titulo">Alterar senha</h2>
    <p>Confirme sua senha atual. Após a alteração, entre novamente com a nova senha.</p>
    {erro && <div className="mensagem-erro" role="alert">{erro}</div>}
    <form className="formulario-publico" onSubmit={enviar} noValidate>
      {['senhaAtual', 'novaSenha', 'confirmacaoSenha'].map((campo, indice) => <CampoSenha key={campo}
        rotulo={['Senha atual', 'Nova senha', 'Confirmar nova senha'][indice]} required
        autoComplete={indice === 0 ? 'current-password' : 'new-password'} validarPolitica={indice === 1} maxLength={72}
        value={dados[campo]} disabled={desabilitado || salvando}
        onChange={(evento) => setDados((atuais) => ({ ...atuais, [campo]: evento.target.value }))} />)}
      <button className="botao-destaque" disabled={desabilitado || salvando}>{salvando ? 'Salvando...' : 'Alterar senha'}</button>
    </form>
  </section>;
}
