import { useState } from 'react';

const MOTIVOS = [
  ['OFENSA', 'Ofensa'], ['ASSEDIO', 'Assédio'], ['DISCRIMINACAO', 'Discriminação'],
  ['CONTEUDO_IMPROPRIO', 'Conteúdo impróprio'], ['DADOS_PESSOAIS', 'Exposição de dados pessoais'],
  ['SPAM', 'Spam'], ['OUTRO', 'Outro']
];

export default function FormularioDenuncia({ aoEnviar, aoCancelar, desabilitado = false }) {
  const [motivo, setMotivo] = useState('CONTEUDO_IMPROPRIO');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    if (enviando || desabilitado) return;
    setEnviando(true);
    try {
      if (await aoEnviar({ motivo, descricao: descricao.trim() || null })) aoCancelar();
    } finally { setEnviando(false); }
  }

  return <form className="card space-y-3" onSubmit={enviar} aria-label="Denunciar conteúdo">
    <h4 className="m-0 text-base font-semibold">Denunciar conteúdo</h4>
    <label className="block text-sm font-medium">Motivo
      <select className="input-field mt-1 w-full" value={motivo} onChange={(evento) => setMotivo(evento.target.value)}>
        {MOTIVOS.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
      </select>
    </label>
    <label className="block text-sm font-medium">Detalhes (opcional)
      <textarea className="input-field mt-1 w-full" maxLength={1000} rows={3} value={descricao} onChange={(evento) => setDescricao(evento.target.value)} />
    </label>
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-danger btn-small" type="submit" disabled={enviando || desabilitado}>{enviando ? 'Enviando…' : 'Enviar denúncia'}</button>
      <button className="btn btn-secondary btn-small" type="button" onClick={aoCancelar} disabled={enviando}>Cancelar</button>
    </div>
  </form>;
}
