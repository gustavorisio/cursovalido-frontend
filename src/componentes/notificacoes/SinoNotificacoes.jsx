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
  return <NavLink className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-200 no-underline transition hover:bg-slate-800 hover:text-white" to="/notificacoes" aria-label={rotulo} title={rotulo}>
    <span>Notificações</span>
    {quantidade > 0 && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{quantidade > 99 ? '99+' : quantidade}</span>}
  </NavLink>;
}
