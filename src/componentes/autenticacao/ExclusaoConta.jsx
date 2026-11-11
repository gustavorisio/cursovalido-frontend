import { useEffect, useRef, useState } from 'react';
import { excluirConta, solicitarExclusaoConta } from '../../servicos/servicoAutenticacao';
import ConfirmacaoModal from '../forum/componentes/ConfirmacaoModal';

export default function ExclusaoConta({ aoExcluir, desabilitado = false, aoProcessar }) {
  const [confirmar, setConfirmar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const campo = useRef(null);
  const emAndamento = useRef(false);
  useEffect(() => { if (enviado) campo.current?.focus(); }, [enviado]);

  function alterarProcessamento(valor) {
    emAndamento.current = valor;
    setProcessando(valor);
    aoProcessar?.(valor);
  }
  async function enviarCodigo() {
    if (emAndamento.current) return;
    alterarProcessamento(true); setErro(''); setMensagem('');
    try {
      await solicitarExclusaoConta();
      setCodigo(''); setEnviado(true);
      setMensagem('Código enviado ao e-mail da sua conta. Ele é válido por 10 minutos.');
    } catch (falha) { setErro(falha.message); }
    finally { setConfirmar(false); alterarProcessamento(false); }
  }
  async function confirmarExclusao(evento) {
    evento.preventDefault();
    if (emAndamento.current) return;
    if (!/^[0-9]{6}$/.test(codigo)) { setErro('Informe o código de seis dígitos enviado ao seu e-mail.'); return; }
    alterarProcessamento(true); setErro(''); setMensagem('');
    try { await excluirConta(codigo); aoExcluir(); }
    catch (falha) { setErro(falha.message); alterarProcessamento(false); }
  }
  return <section className="exclusao-conta" aria-labelledby="titulo-exclusao">
    <h2 className="titulo-detalhe" id="titulo-exclusao">Excluir minha conta</h2>
    <p className="texto-suave">A exclusão é permanente. Para confirmar, será necessário informar um código enviado ao e-mail da sua conta.</p>
    {erro && <p className="mensagem-erro" role="alert">{erro}</p>}
    {mensagem && <p className="mensagem-sucesso" role="status">{mensagem}</p>}
    {!enviado ? <button className="btn btn-danger" type="button" disabled={processando || desabilitado} onClick={() => setConfirmar(true)}>Excluir minha conta</button> : <form className="formulario-publico" onSubmit={confirmarExclusao} aria-busy={processando}>
      <label htmlFor="codigo-exclusao">Código de confirmação<input ref={campo} id="codigo-exclusao" name="codigo" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={codigo} onChange={(evento) => setCodigo(evento.target.value.replace(/[^0-9]/g, '').slice(0, 6))} disabled={processando || desabilitado} aria-describedby="ajuda-exclusao" /></label>
      <p className="texto-suave" id="ajuda-exclusao">Digite os seis dígitos, incluindo zeros iniciais. Ao confirmar, sua conta e os dados relacionados serão removidos conforme as regras da plataforma.</p>
      <div className="acoes-configuracoes"><button className="btn btn-danger" type="submit" disabled={processando || desabilitado || codigo.length !== 6}>{processando ? 'Processando...' : 'Confirmar exclusão permanente'}</button><button className="btn btn-secondary" type="button" disabled={processando || desabilitado} onClick={enviarCodigo}>Reenviar código</button><button className="btn btn-secondary" type="button" disabled={processando || desabilitado} onClick={() => { setEnviado(false); setCodigo(''); setErro(''); setMensagem(''); }}>Cancelar</button></div>
    </form>}
    {confirmar && <ConfirmacaoModal titulo="Solicitar exclusão da conta" mensagem="A exclusão da conta é permanente. Deseja receber por e-mail o código para confirmar essa ação?" processando={processando} onConfirmar={enviarCodigo} onCancelar={() => { if (!emAndamento.current) setConfirmar(false); }} />}
  </section>;
}
