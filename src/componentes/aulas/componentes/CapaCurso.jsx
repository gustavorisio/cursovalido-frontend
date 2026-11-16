import { useState } from 'react';

export default function CapaCurso({ curso }) {
  const [falhou, setFalhou] = useState(null);
  const capa = curso.capaJpeg;
  return <div className="curso-capa">
    {capa && falhou !== capa ? <img src={capa} alt={`Capa do curso ${curso.titulo}`} width="550" height="250" loading="lazy" decoding="async" onError={() => setFalhou(capa)} /> : null}
  </div>;
}
