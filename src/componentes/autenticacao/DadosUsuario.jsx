import { useEffect, useRef, useState } from 'react';
import { buscarMeusDados, baixarDadosPessoais, configurarSegundoFator } from '../../servicos/servicoAutenticacao';
import { useAutenticacao } from '../../contextos/useAutenticacao';

function formatarDataHoraAceite(valor) {
  if (!valor) return 'Não informado';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(data);
}

export default function DadosUsuario({ desabilitado = false }) {
  const { sessao } = useAutenticacao();
  const [baixando, setBaixando] = useState(false);
  // Trava sincrona: barra o segundo clique antes de o botao ser desabilitado na tela.
  const acaoEmAndamento = useRef(false);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [alterandoSegundoFator, setAlterandoSegundoFator] = useState(false);
  const perfil = dados?.perfil ?? sessao?.perfil;
  const codigoPerfil = typeof perfil === 'object' && perfil !== null ? perfil.nome ?? perfil.codigo ?? perfil.descricao : perfil;
  const nomePerfil = { ALUNO: 'Aluno', PROFESSOR: 'Professor', ADMINISTRADOR: 'Administrador', ADMIN: 'Administrador' }[String(codigoPerfil).toUpperCase()] ?? 'Não informado';
  const segundoFatorObrigatorio = ['PROFESSOR', 'ADMINISTRADOR'].includes(String(codigoPerfil).toUpperCase());
  useEffect(() => {
    let ativo = true;
    buscarMeusDados().then(resposta => { if (ativo) setDados(resposta); })
      .catch(falha => { if (ativo) setErro(falha.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]);


  async function baixar() {
    if (baixando || acaoEmAndamento.current) return;
    acaoEmAndamento.current = true; setBaixando(true); setErro('');
    try { await baixarDadosPessoais(); setMensagem('Download dos dados pessoais iniciado.'); }
    catch (falha) { setErro(falha.message); }
    finally { acaoEmAndamento.current = false; setBaixando(false); }
  }

  async function alternarSegundoFator() {
    if (!dados || alterandoSegundoFator || desabilitado || acaoEmAndamento.current) return;
    acaoEmAndamento.current = true;
    setAlterandoSegundoFator(true);
    setErro('');
    setMensagem('');
    const ativo = !dados.doisFatoresAtivos;
    try {
      await configurarSegundoFator(ativo);
      setDados((atual) => ({ ...atual, doisFatoresAtivos: ativo }));
      setMensagem(ativo
        ? 'Autenticação em duas etapas ativada. O código será solicitado no próximo login.'
        : 'Autenticação em duas etapas desativada.');
    } catch (falha) {
      setErro(falha.message || 'Não foi possível atualizar a autenticação em duas etapas.');
    } finally {
      acaoEmAndamento.current = false;
      setAlterandoSegundoFator(false);
    }
  }

  return <section className="dados-usuario" aria-labelledby="titulo-dados-usuario">
    <h2 id="titulo-dados-usuario">Dados do usuário</h2><button className="btn btn-secondary" type="button" disabled={baixando || desabilitado || carregando} onClick={baixar}>{baixando ? 'Preparando download...' : 'Baixar meus dados pessoais'}</button>
    {carregando && <p role="status">Carregando seus dados...</p>}
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    {!carregando && !dados && <button className="btn btn-secondary" type="button" onClick={() => { setErro(''); setCarregando(true); setTentativa(tentativa + 1); }}>Tentar novamente</button>}
    {mensagem && <p role="status">{mensagem}</p>}
    {dados && <>
      <dl className="dados-usuario-grade">
        <div><dt>Nome</dt><dd>{dados.nomeCompleto || 'Não informado'}</dd></div>
        <div><dt>Gamertag</dt><dd>{dados.gamertag || 'Não informada'}</dd></div>
        <div><dt>E-mail</dt><dd>{dados.email || 'Não informado'}</dd></div>
        <div><dt>Perfil do usuário</dt><dd>{nomePerfil}</dd></div>
        {String(codigoPerfil).toUpperCase() === 'ALUNO' && <div><dt>Matrícula</dt><dd>{dados.matricula ?? 'Não informada'}</dd></div>}
        <div><dt>Último aceite dos termos</dt><dd>{formatarDataHoraAceite(dados.dataHoraAceite)}</dd></div>
        <div><dt>Versão dos termos aceitos</dt><dd>{dados.versaoTermos || 'Não informada'}</dd></div>
      </dl>
      <section className="card autenticacao-segundo-fator" aria-labelledby="titulo-segundo-fator">
        <h3 id="titulo-segundo-fator">Autenticação em duas etapas</h3>
        {segundoFatorObrigatorio
          ? <p className="texto-suave">Obrigatória para professores e administradores. Um código enviado por e-mail será solicitado em todos os logins.</p>
          : <>
            <p className="texto-suave">Status: {dados.doisFatoresAtivos ? 'Ativada' : 'Desativada'}. Quando ativada, será solicitado um código enviado por e-mail no próximo login.</p>
            <button className={dados.doisFatoresAtivos ? 'btn btn-secondary' : 'btn btn-primary'} type="button"
              disabled={desabilitado || alterandoSegundoFator || carregando} onClick={alternarSegundoFator}>
              {alterandoSegundoFator ? 'Atualizando...' : dados.doisFatoresAtivos ? 'Desativar autenticação em duas etapas' : 'Ativar autenticação em duas etapas'}
            </button>
          </>}
      </section>
    </>}
  </section>;
}
