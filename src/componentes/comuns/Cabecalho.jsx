import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import { useRestricoes } from '../../contextos/useRestricoes';
import SinoNotificacoes from '../notificacoes/SinoNotificacoes';
import { buscarGamificacao } from '../../servicos/servicoGamificacao';

export default function Cabecalho() {
  const { sessao, sair, autenticado } = useAutenticacao();
  const { restricoes } = useRestricoes();
  const administrador = sessao?.perfil === 'ADMINISTRADOR';
  const [nivel, setNivel] = useState(null);
  const itens = [
    ...(!autenticado ? [{ label: 'Início', path: '/', end: true }] : []),
    { label: 'Cursos', path: '/cursos' },
    { label: 'Fórum', path: autenticado ? '/forum' : '/login' },
    ...(autenticado ? [{ label: 'Ranking', path: '/ranking' }] : []),
    ...(administrador ? [{ label: 'Administração', path: '/administracao' }] : []),
  ];
  const nomes = { CONTA: 'Acesso à conta', FORUM: 'Acesso ao fórum', TOPICOS: 'Acesso a tópicos e comentários', COMENTARIOS: 'Acesso a tópicos e comentários' };

  useEffect(() => {
    let ativo = true;
    const atualizarNivel = () => {
      if (!autenticado || sessao?.perfil !== 'ALUNO') return;
      buscarGamificacao().then((dados) => { if (ativo) setNivel(dados.nivel); }).catch(() => { if (ativo) setNivel(null); });
    };
    if (autenticado && sessao?.perfil === 'ALUNO') atualizarNivel();
    else queueMicrotask(() => { if (ativo) setNivel(null); });
    globalThis.addEventListener?.('curso-valido-gamificacao-atualizada', atualizarNivel);
    return () => {
      ativo = false;
      globalThis.removeEventListener?.('curso-valido-gamificacao-atualizada', atualizarNivel);
    };
  }, [autenticado, sessao?.idUsuario, sessao?.id, sessao?.perfil]);

  return <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-700 bg-slate-900 text-white shadow-sm">
    <div className="mx-auto flex min-h-14 max-w-[1600px] items-center gap-2 px-2 sm:gap-5 sm:px-5">
      <Link to="/" className="shrink-0 text-lg font-semibold tracking-tight text-white no-underline sm:text-xl">Curso<span className="text-blue-400">Válido</span></Link>
      <nav aria-label="Navegação principal" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-xs sm:gap-1 sm:text-sm">
        {itens.map((item) => <NavLink key={item.label} to={item.path} end={item.end} className={({ isActive }) => `shrink-0 rounded-md px-2 py-2 no-underline transition hover:bg-slate-800 hover:text-white sm:px-3 ${isActive ? 'bg-slate-800 font-semibold text-white' : 'text-slate-300'}`}>{item.label}</NavLink>)}
        {autenticado && <SinoNotificacoes key={sessao?.idUsuario ?? sessao?.id} />}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-4 text-sm">
        {autenticado ? <>
          <Link className="inline-flex min-h-10 items-center rounded-md px-3 py-2 font-medium text-white no-underline transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" to="/configuracoes">Configurações</Link>
          {nivel != null && <span className="whitespace-nowrap text-slate-200">(Level {nivel})</span>}
          <button className="min-h-10 rounded-md border border-slate-600 px-4 py-2 font-medium text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" type="button" onClick={sair}>Sair</button>
        </> : <Link className="rounded-md px-3 py-2 font-medium text-white no-underline hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400" to="/login">Entrar</Link>}
      </div>
    </div>
    {restricoes.length > 0 && <div className="absolute left-0 right-0 top-full border-b border-amber-300 bg-amber-50 px-5 py-2 text-sm text-amber-900 shadow-sm">{restricoes.map((item) => <p key={item.id} className="m-1">{nomes[item.escopo]} restrito: {item.motivo} · {item.expiraEm ? `Até ${new Date(item.expiraEm).toLocaleString('pt-BR')}` : 'Permanente, até revogação'}</p>)}</div>}
  </header>;
}
