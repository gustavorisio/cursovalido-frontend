import '../../paginas/inicio.css';
import { Link, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { buscarGamificacao } from '../../servicos/servicoGamificacao';
import { useAutenticacao } from '../../contextos/useAutenticacao';
import { useRestricoes } from '../../contextos/useRestricoes';
import SinoNotificacoes from '../notificacoes/SinoNotificacoes';

export default function Cabecalho() {
  const { sessao, sair, autenticado } = useAutenticacao();
  const ehAdministrador = sessao?.perfil === 'ADMINISTRADOR';
  const { restricoes } = useRestricoes();
  const [nivel, setNivel] = useState(null);
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
  const nomes = { CONTA: 'Acesso à conta', FORUM: 'Acesso ao fórum', TOPICOS: 'Acesso a tópicos e comentários', COMENTARIOS: 'Acesso a tópicos e comentários' };

  return (
    <header className="cv-header cv-home">
      <nav className="cv-nav" aria-label="Navegação principal">
        <NavLink to="/" end>Início</NavLink>
        <NavLink to={!autenticado ? '/cursos' : ehAdministrador ? '/administracao/cursos' : sessao?.perfil === 'PROFESSOR' ? '/professor/cursos' : '/aluno/cursos'}>Aulas online</NavLink>
        <NavLink to="/forum">Fórum</NavLink>
        {autenticado && <NavLink to="/ranking">Ranking</NavLink>}
        {ehAdministrador && <NavLink to="/administracao" end>Administração</NavLink>}
      </nav>
      <div className="cv-conta">
        {autenticado && <SinoNotificacoes key={sessao?.idUsuario ?? sessao?.id} />}
        {autenticado ? <><NavLink to="/configuracoes">Configurações</NavLink>{nivel != null && <span aria-label={"Nível " + nivel}>Nível {nivel}</span>}<button className="cv-button cv-button-primary" type="button" onClick={sair}>Sair</button></> : <><Link to="/login">Entrar</Link><Link className="cv-button cv-button-primary" to="/cadastro">Criar conta</Link></>}
      </div>
      {restricoes.length > 0 ? <div className="mensagem-erro w-full" role="status">
        {restricoes.map((item) => <p key={item.id}>{nomes[item.escopo]} restrito: {item.motivo} · {item.expiraEm ? `Até ${new Date(item.expiraEm).toLocaleString('pt-BR')}` : 'Permanente, até revogação'}</p>)}
      </div> : null}
    </header>
  );
}
