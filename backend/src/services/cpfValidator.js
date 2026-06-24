/**
 * Valida um CPF (Cadastro de Pessoas Físicas) brasileiro.
 * @param {string} cpf - O CPF a ser validado (com ou sem formatação).
 * @returns {boolean} - Retorna true se o CPF for válido, false caso contrário.
 */
export function validateCPF(cpf) {
  if (!cpf) return false;

  // Remover caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '');

  // Verificar se possui 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Eliminar CPFs conhecidos inválidos (sequências repetidas)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10), 10)) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i), 10) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11), 10)) return false;

  return true;
}

/**
 * Formata um CPF no padrão 000.000.000-00.
 * @param {string} cpf 
 * @returns {string}
 */
export function formatCPF(cpf) {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  if (cleanCPF.length !== 11) return cpf;
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
