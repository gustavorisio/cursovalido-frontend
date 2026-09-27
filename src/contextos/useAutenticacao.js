import { useContext } from 'react';
import { AutenticacaoContexto } from './contextoBaseAutenticacao';

export function useAutenticacao() {
  const contexto = useContext(AutenticacaoContexto);
  if (!contexto) throw new Error('useAutenticacao deve ser usado dentro de AutenticacaoProvedor.');
  return contexto;
}
