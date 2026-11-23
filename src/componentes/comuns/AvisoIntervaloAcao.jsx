import { useEffect, useState } from 'react';

export default function AvisoIntervaloAcao() {
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    const mostrar = (evento) => setAviso(evento.detail);
    globalThis.addEventListener('curso-valido-intervalo-acao', mostrar);
    return () => globalThis.removeEventListener('curso-valido-intervalo-acao', mostrar);
  }, []);
  useEffect(() => {
    if (!aviso) return;
    const timer = window.setTimeout(() => setAviso(null), aviso.segundos * 1000);
    return () => window.clearTimeout(timer);
  }, [aviso]);
  if (!aviso) return null;
  return <div role="alert" className="aviso-intervalo-acao card aviso-erro">
    <span>{aviso.mensagem}</span>
    <button type="button" className="btn btn-link" onClick={() => setAviso(null)}>Fechar aviso de espera</button>
  </div>;
}
