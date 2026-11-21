import { requisitar } from './api';

export const buscarVideoInicio = () => requisitar('/inicio/video', { cache: 'no-store' });

export const atualizarVideoInicio = (vimeoUrl) => requisitar('/administracao/inicio/video', {
  method: 'PUT',
  body: JSON.stringify({ vimeoUrl }),
});
