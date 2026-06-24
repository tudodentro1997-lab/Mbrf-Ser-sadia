// Script de teste lógico para o Sistema de Reservas MBRF / Sadia
// Executa testes unitários na lógica de validação de CPF e detecção de choques de horário.

import { validateCPF } from '../src/services/cpfValidator.js';

async function runTests() {
  console.log('=== INICIANDO TESTES DE VALIDAÇÃO LOGICA ===\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
      failedTests++;
    }
  }

  // 1. Testes de CPF
  console.log('--- Testando Validação de CPF ---');
  assert(validateCPF('11144477735') === true, 'CPF estruturalmente válido deve ser aceito.');
  assert(validateCPF('00000000000') === false, 'CPF com todos os dígitos iguais deve ser rejeitado.');
  assert(validateCPF('12345678912') === false, 'CPF inválido pelo dígito verificador deve ser rejeitado.');
  assert(validateCPF('123') === false, 'CPF com tamanho menor que 11 dígitos deve ser rejeitado.');

  // 2. Testes de Choque de Horários
  console.log('\n--- Testando Lógica de Detecção de Conflitos de Horários ---');
  
  const mockExistingBookings = [
    { startTime: '10:00', endTime: '12:00' },
    { startTime: '14:00', endTime: '16:00' }
  ];

  function simulateConflictCheck(newStart, newEnd) {
    for (const booking of mockExistingBookings) {
      if (newStart < booking.endTime && newEnd > booking.startTime) {
        return true; // Há choque
      }
    }
    return false; // Livre
  }

  assert(simulateConflictCheck('08:00', '10:00') === false, 'Reserva terminando exatamente quando outra começa deve ser permitida.');
  assert(simulateConflictCheck('12:00', '14:00') === false, 'Reserva iniciando exatamente quando outra termina e terminando quando outra começa deve ser permitida.');
  assert(simulateConflictCheck('09:00', '11:00') === true, 'Reserva iniciando antes e terminando no meio de outra deve ser bloqueada.');
  assert(simulateConflictCheck('11:00', '13:00') === true, 'Reserva iniciando no meio e terminando depois de outra deve ser bloqueada.');
  assert(simulateConflictCheck('10:30', '11:30') === true, 'Reserva inteiramente contida dentro de outra deve ser bloqueada.');
  assert(simulateConflictCheck('09:00', '13:00') === true, 'Reserva englobando totalmente outra deve ser bloqueada.');
  assert(simulateConflictCheck('16:00', '18:00') === false, 'Reserva em horário totalmente vago deve ser permitida.');

  console.log(`\n=== FIM DOS TESTES ===`);
  console.log(`Passou: ${passedTests} | Falhou: ${failedTests}`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
