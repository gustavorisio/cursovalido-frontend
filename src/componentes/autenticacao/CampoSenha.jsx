import { mensagemSenha, REGRAS_SENHA } from '../../servicos/politicaSenha';
import { useId, useState } from 'react';

export default function CampoSenha({ rotulo = 'Senha', autoComplete = 'new-password', validarPolitica = true, erro = '', ...props }) {
  const [visivel, setVisivel] = useState(false);
  const id = useId();
  const idRegras = `${id}-regras`;
  const idErro = `${id}-erro`;
  const valor = String(props.value ?? '');
  const exibirRegras = validarPolitica && valor.length > 0;
  return <div className="campo-senha">
    <label htmlFor={id}>{rotulo}</label>
    <div className="campo-senha-controle">
      <input {...props} id={id} type={visivel ? 'text' : 'password'} autoComplete={autoComplete}
        maxLength={validarPolitica ? 72 : props.maxLength}
        aria-invalid={Boolean(erro)}
        aria-describedby={[exibirRegras ? idRegras : '', erro ? idErro : '', props['aria-describedby']].filter(Boolean).join(' ') || undefined}
        onInvalid={(evento) => {
          const problema = validarPolitica ? mensagemSenha(evento.target.value) : '';
          if (problema) evento.target.setCustomValidity(problema);
          props.onInvalid?.(evento);
        }}
        onChange={(evento) => {
          evento.target.setCustomValidity('');
          const problema = validarPolitica && evento.target.value ? mensagemSenha(evento.target.value) : '';
          if (problema) evento.target.setCustomValidity(problema);
          props.onChange?.(evento);
        }} />
      <button type="button" className="alternar-senha" aria-label={`${visivel ? 'Ocultar' : 'Mostrar'} ${rotulo.toLowerCase()}`} aria-controls={id} aria-pressed={visivel} onClick={() => setVisivel((atual) => !atual)} disabled={props.disabled}>
        {visivel ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
    {exibirRegras && <ul className="regras-senha" id={idRegras} aria-live="polite">
      {REGRAS_SENHA.map((regra) => {
        const atendida = regra.atende(valor);
        return <li key={regra.id} className={atendida ? 'regra-atendida' : 'regra-pendente'}>
          {regra.texto}<span className="sr-only">{atendida ? ' (atendido)' : ' (pendente)'}</span>
        </li>;
      })}
    </ul>}
    {erro && <small className="erro-campo" id={idErro} role="status">{erro}</small>}
  </div>;
}
