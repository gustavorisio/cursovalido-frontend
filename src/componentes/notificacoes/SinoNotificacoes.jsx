import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { contarNaoLidas, EVENTO_NOTIFICACOES } from '../../servicos/servicoNotificacoes';
import './notificacoes.css';

export default function SinoNotificacoes() {
  const [quantidade, setQuantidade] = useState(0);

  useEffect(() => {
    let ativo = true;
    let consultando = false;
    let repetir = false;
    async function atualizar() {
      if (consultando) { repetir = true; return; }
      consultando = true;
      try {
        const dados = await contarNaoLidas();
        if (ativo) setQuantidade(dados.quantidade);
      } catch {
        // A página de notificações oferece a mensagem de erro e a opção de tentar novamente.
      } finally {
        consultando = false;
        if (repetir && ativo) { repetir = false; atualizar(); }
      }
    }
    function aoVoltar() { if (document.visibilityState === 'visible') atualizar(); }
    atualizar();
    const intervalo = window.setInterval(aoVoltar, 60000);
    window.addEventListener(EVENTO_NOTIFICACOES, atualizar);
    window.addEventListener('focus', aoVoltar);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      ativo = false;
      window.clearInterval(intervalo);
      window.removeEventListener(EVENTO_NOTIFICACOES, atualizar);
      window.removeEventListener('focus', aoVoltar);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, []);

  const rotulo = quantidade ? `Notificações: ${quantidade} ${quantidade === 1 ? 'não lida' : 'não lidas'}` : 'Notificações';
  return <NavLink className="notificacoes-sino" to="/notificacoes" aria-label={rotulo} title={rotulo}>
    <span className="notificacoes-sino-icone" aria-hidden="true" />
    {quantidade > 0 && <span className="notificacoes-contador" aria-hidden="true">{quantidade > 99 ? '99+' : quantidade}</span>}
  </NavLink>;
}
