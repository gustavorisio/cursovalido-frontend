import { useEffect, useId, useRef } from 'react';

export default function ConfirmacaoModal({ titulo, mensagem, onConfirmar, onCancelar, processando = false }) {
  const caixa = useRef(null);
  const cancelar = useRef(null);
  const id = useId();
  useEffect(() => {
    const anterior = document.activeElement;
    cancelar.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; anterior?.focus(); };
  }, []);

  function teclado(evento) {
    if (evento.key === 'Escape' && !processando) { evento.preventDefault(); onCancelar(); }
    if (evento.key !== 'Tab') return;
    const botoes = [...caixa.current.querySelectorAll('button:not(:disabled)')];
    if (!botoes.length) { evento.preventDefault(); return; }
    const primeiro = botoes[0];
    const ultimo = botoes[botoes.length - 1];
    if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
  }

  return <div className="modal-fundo" role="presentation" onClick={() => { if (!processando) onCancelar(); }}>
    <div ref={caixa} className="modal-caixa" role="dialog" aria-modal="true" aria-labelledby={id} aria-describedby={id + '-mensagem'} aria-busy={processando} onKeyDown={teclado} onClick={(evento) => evento.stopPropagation()}>
      <h3 id={id}>{titulo}</h3>
      <p id={id + '-mensagem'}>{mensagem}</p>
      <div className="modal-acoes">
        <button ref={cancelar} className="btn btn-secondary" type="button" disabled={processando} onClick={onCancelar}>Cancelar</button>
        <button className="btn btn-danger" type="button" disabled={processando} onClick={onConfirmar}>{processando ? 'Processando...' : 'Confirmar'}</button>
      </div>
    </div>
  </div>;
}
