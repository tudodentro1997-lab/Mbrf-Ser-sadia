import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

export default function Calendar({ spaceId, selectedDate, onDateSelect, selectedTimeSlot, onTimeSlotSelect }) {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Lista de horários padrão para reserva (intervalos de 2 horas, das 08:00 às 22:00)
  const defaultSlots = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '12:00', end: '14:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
    { start: '18:00', end: '20:00' },
    { start: '20:00', end: '22:00' }
  ];

  // Buscar disponibilidade do dia selecionado
  useEffect(() => {
    if (!spaceId || !selectedDate) return;

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/bookings/availability?spaceId=${spaceId}&date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          setAvailability(data);
        }
      } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [spaceId, selectedDate]);

  // Função para verificar se um slot específico está ocupado ou livre
  const getSlotStatus = (slot) => {
    // Retorna a reserva conflitante se houver choque
    const conflict = availability.find(booking => {
      return slot.start < booking.endTime && slot.end > booking.startTime;
    });

    if (conflict) {
      if (conflict.userType === 'ADMIN') {
        return { status: 'BLOQUEADO', label: 'Bloqueado p/ Manutenção', class: 'slot-blocked' };
      }
      return { status: 'RESERVADO', label: 'Reservado', class: 'slot-reserved' };
    }

    return { status: 'DISPONIVEL', label: 'Disponível', class: 'slot-available' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Seletor de Data */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CalendarIcon size={18} /> Selecione a Data
        </label>
        <input
          type="date"
          min={new Date().toISOString().split('T')[0]} // Impede datas passadas
          value={selectedDate}
          onChange={(e) => {
            onDateSelect(e.target.value);
            onTimeSlotSelect(null); // Reseta horário escolhido ao trocar a data
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontFamily: 'var(--font-sans)'
          }}
        />
      </div>

      {/* Grid de Horários */}
      {selectedDate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} /> Horários Disponíveis para este dia
          </label>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verificando disponibilidade...</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
              marginTop: '8px'
            }}>
              {defaultSlots.map((slot, index) => {
                const info = getSlotStatus(slot);
                const isSelected = selectedTimeSlot && selectedTimeSlot.start === slot.start && selectedTimeSlot.end === slot.end;

                return (
                  <button
                    key={index}
                    disabled={info.status !== 'DISPONIVEL'}
                    onClick={() => onTimeSlotSelect(slot)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '14px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      cursor: info.status === 'DISPONIVEL' ? 'pointer' : 'not-allowed',
                      transition: 'all var(--transition-fast)',
                      backgroundColor: isSelected 
                        ? 'var(--primary)' 
                        : info.status === 'DISPONIVEL' 
                          ? 'var(--bg-secondary)' 
                          : info.status === 'RESERVADO'
                            ? 'var(--danger-light)'
                            : 'var(--warning-light)',
                      borderColor: isSelected
                        ? 'var(--primary)'
                        : info.status === 'DISPONIVEL'
                          ? 'var(--border-color)'
                          : info.status === 'RESERVADO'
                            ? 'var(--danger)'
                            : 'var(--warning)',
                      color: isSelected
                        ? '#ffffff'
                        : info.status === 'DISPONIVEL'
                          ? 'var(--text-primary)'
                          : info.status === 'RESERVADO'
                            ? 'var(--danger)'
                            : 'var(--warning)'
                    }}
                    title={info.status === 'DISPONIVEL' ? 'Clique para reservar' : info.label}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{slot.start} - {slot.end}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      marginTop: '4px',
                      fontWeight: 600,
                      opacity: 0.8
                    }}>
                      {info.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Legenda */}
          <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginTop: '8px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
              <span>Disponível</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger-light)', border: '1px solid var(--danger)' }} />
              <span>Reservado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }} />
              <span>Bloqueado (Manutenção)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
