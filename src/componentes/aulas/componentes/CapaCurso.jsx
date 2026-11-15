import { useState } from 'react';

export default function CapaCurso({ curso }) {
  const [falhou, setFalhou] = useState(null);
  const capa = curso.capaJpeg;
  return <div className="curso-capa">
    {capa && falhou !== capa ? <img src={capa} alt={`Capa do curso ${curso.titulo}`} width="550" height="250" loading="lazy" decoding="async" onError={() => setFalhou(capa)} /> :
      <div className="curso-capa-reserva" aria-label={`Curso ${curso.titulo}`}>
        <svg viewBox="0 0 80 64" fill="none" aria-hidden="true"><path d="m27 18-18 14 18 14m26-28 18 14-18 14M46 9 34 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span>{curso.nomeTema || 'Tecnologia e programação'}</span>
      </div>}
  </div>;
}
