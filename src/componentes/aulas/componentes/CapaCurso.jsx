import { useState } from 'react';

export default function CapaCurso({ curso, className = '' }) {
  const [falhou, setFalhou] = useState(null);
  const capa = curso.capaJpeg;
  return <div className={`curso-capa ${className}`}>
    {capa && falhou !== capa ? <img className="!h-full !w-full !object-contain" src={capa} alt={`Capa do curso ${curso.titulo}`} width="550" height="250" loading="lazy" decoding="async" onError={() => setFalhou(capa)} /> : <div className="grid h-full place-items-center bg-slate-100 text-sm text-slate-500">Capa do curso</div>}
  </div>;
}
