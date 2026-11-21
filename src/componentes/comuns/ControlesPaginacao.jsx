export default function ControlesPaginacao({ pagina, total, rotulo, desabilitada = false, exibirPaginaUnica = false, className = '', onAnterior, onProxima }) {
  if (total <= 1 && !exibirPaginaUnica) return null;

  const classeBotao = 'inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface px-4 py-2 font-medium text-brand-700 transition-colors hover:border-brand-500 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45';

  return <nav className={`paginacao-lista mt-8 flex flex-wrap items-center justify-center gap-3 rounded-[var(--radius-panel)] border border-line bg-surface px-4 py-3 text-sm text-muted shadow-panel ${className}`} aria-label={rotulo}>
    <button className={classeBotao} type="button" disabled={desabilitada || pagina === 0} onClick={onAnterior}>Anterior</button>
    <span className="min-w-28 text-center tabular-nums" aria-live="polite">Página {pagina + 1} de {total}</span>
    <button className={classeBotao} type="button" disabled={desabilitada || pagina + 1 >= total} onClick={onProxima}>Próxima</button>
  </nav>;
}
