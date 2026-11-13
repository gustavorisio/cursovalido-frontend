import { useEffect, useState } from 'react';
import { buscarMeusDados, baixarDadosPessoais } from '../../servicos/servicoAutenticacao';
import { useAutenticacao } from '../../contextos/useAutenticacao';


export default function DadosUsuario({ desabilitado = false }) {
  const { sessao } = useAutenticacao();
  const [baixando, setBaixando] = useState(false);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const perfil = dados?.perfil ?? sessao?.perfil;
  const codigoPerfil = typeof perfil === 'object' && perfil !== null ? perfil.nome ?? perfil.codigo ?? perfil.descricao : perfil;
  const nomePerfil = { ALUNO: 'Aluno', PROFESSOR: 'Professor', ADMINISTRADOR: 'Administrador', ADMIN: 'Administrador' }[String(codigoPerfil).toUpperCase()] ?? 'Não informado';
  useEffect(() => {
    let ativo = true;
    buscarMeusDados().then(resposta => { if (ativo) setDados(resposta); })
      .catch(falha => { if (ativo) setErro(falha.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [tentativa]);


  async function baixar() {
    if (baixando) return;
    setBaixando(true); setErro('');
    try { await baixarDadosPessoais(); setMensagem('Download dos dados pessoais iniciado.'); }
    catch (falha) { setErro(falha.message); }
    finally { setBaixando(false); }
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
        <div><dt>E-mail</dt><dd>{dados.email || 'Não informado'}</dd></div>
        <div><dt>Perfil do usuário</dt><dd>{nomePerfil}</dd></div>
        <div><dt>Data de nascimento</dt><dd>{dados.dataNascimento ? dados.dataNascimento.split('-').reverse().join('/') : 'Não informada'}</dd></div>
      </dl>
    </>}
  </section>;
}
