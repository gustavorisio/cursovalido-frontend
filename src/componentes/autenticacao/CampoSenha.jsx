import { useId, useState } from 'react';

export default function CampoSenha({ rotulo = 'Senha', autoComplete = 'new-password', validarPolitica = true, ...props }) {
  const [visivel, setVisivel] = useState(false);
  const id = useId();
  return <div className="campo-senha">
    <label htmlFor={id}>{rotulo}</label>
    <div className="campo-senha-controle">
      <input {...props} id={id} type={visivel ? 'text' : 'password'} autoComplete={autoComplete}
        onInvalid={(evento) => {
          if (validarPolitica && evento.target.validity.tooShort) evento.target.setCustomValidity('Informe uma senha válida.');
        }}
        onChange={(evento) => { evento.target.setCustomValidity(''); props.onChange?.(evento); }} />
      <button type="button" className="alternar-senha" aria-label={`${visivel ? 'Ocultar' : 'Mostrar'} ${rotulo.toLowerCase()}`} aria-controls={id} aria-pressed={visivel} onClick={() => setVisivel((atual) => !atual)} disabled={props.disabled}>
        {visivel ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  </div>;
}
