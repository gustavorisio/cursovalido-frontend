import { Link, useLocation } from 'react-router-dom';

export default function Rodape({ onDocumento } = {}) {
  const localizacao = useLocation();
  const emDocumento = /termos-aceite|politica-privacidade/.test(localizacao.pathname);
  const estado = { retornoDocumentos: emDocumento ? localizacao.state?.retornoDocumentos || '/' : localizacao.pathname + localizacao.search };
  return (
    <footer className="mt-auto w-full shrink-0 border-t border-slate-200 bg-white px-4 py-6 text-sm text-slate-600 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0"><strong className="block font-semibold text-slate-800">Curso Válido</strong><span className="mt-1 block text-xs text-slate-500">Projeto Final de Curso · Engenharia de Software · UMC</span></div>
        <nav aria-label="Links legais e suporte" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link className="text-slate-600 no-underline hover:text-blue-700 hover:underline" to="/suporte">Suporte</Link>
          <Link className="text-slate-600 no-underline hover:text-blue-700 hover:underline" to="/termos-aceite.html" replace={emDocumento} state={estado} onClick={onDocumento ? evento => { evento.preventDefault(); onDocumento('termos'); } : undefined}>Termos de Aceite</Link>
          <Link className="text-slate-600 no-underline hover:text-blue-700 hover:underline" to="/politica-privacidade.html" replace={emDocumento} state={estado} onClick={onDocumento ? evento => { evento.preventDefault(); onDocumento('privacidade'); } : undefined}>Política de Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}
