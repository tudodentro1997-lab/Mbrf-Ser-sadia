import React, { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import BookingModal from '../components/BookingModal';
import { CalendarDays, Users, ShieldAlert, BadgeInfo } from 'lucide-react';

export default function Home({ token, user, onNavigate }) {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await fetch('/api/spaces');
        if (response.ok) {
          const data = await response.json();
          setSpaces(data);
        }
      } catch (error) {
        console.error('Erro ao buscar espaços:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  const handleBookingStart = (space) => {
    setSelectedSpace(space);
    // Reset date/time selection
    setSelectedDate('');
    setSelectedTimeSlot(null);
    
    // Rola suavemente até o calendário
    setTimeout(() => {
      document.getElementById('booking-calendar-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleOpenBookingModal = () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setShowBookingModal(true);
  };

  return (
    <div style={{ padding: '40px 0' }}>
      {/* Hero Banner Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 0',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-lg)'
      }} className="container">
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', color: '#ffffff', marginBottom: '16px' }}>
          Espaços para Eventos MBRF Sadia
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 24px' }}>
          Reserve de forma totalmente online o local ideal para sua confraternização, futebol ou reunião familiar.
        </p>
        {!user && (
          <button onClick={() => onNavigate('login')} className="btn btn-accent" style={{ padding: '12px 28px', fontSize: '1.05rem' }}>
            Acesse para reservar agora
          </button>
        )}
      </section>

      {/* Catálogo de Espaços */}
      <section className="container" style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '24px' }}>
          Nossos Espaços Disponíveis
        </h2>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Buscando locais disponíveis...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {spaces.map(space => (
              <div key={space.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '0px',
                overflow: 'hidden'
              }}>
                {/* Foto do local ou Gradiente de Fallback */}
                <div style={{
                  height: '180px',
                  backgroundImage: space.imageUrls && space.imageUrls.length > 0 && space.imageUrls[0] && !space.imageUrls[0].startsWith('/images/')
                    ? `url(${space.imageUrls[0]})`
                    : 'linear-gradient(25deg, var(--primary-light) 0%, var(--accent) 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  position: 'relative'
                }}>
                  {(!space.imageUrls || space.imageUrls.length === 0 || !space.imageUrls[0] || space.imageUrls[0].startsWith('/images/')) && (
                    <CalendarDays size={48} style={{ opacity: 0.4 }} />
                  )}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Users size={14} /> Cap. {space.capacity}
                  </span>
                </div>

                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-display)' }}>{space.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineBreak: 'normal', flex: 1 }}>
                    {space.description}
                  </p>

                  {/* Preços */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '12px',
                    marginTop: '8px',
                    fontSize: '0.85rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Preço Sócio</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                        {space.priceSocio === 0 ? 'Grátis' : `R$ ${space.priceSocio.toFixed(2)}`}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Não Sócio / Atrasado</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        R$ {space.priceNaoSocio.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookingStart(space)}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                  >
                    Consultar Disponibilidade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calendário Dinâmico e Agendamento */}
      {selectedSpace && (
        <section 
          id="booking-calendar-section" 
          className="container animate-fade-in" 
          style={{ 
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '40px',
            scrollMarginTop: '90px'
          }}
        >
          <div className="card" style={{ padding: '32px', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ marginBottom: '24px' }}>
              <span className="badge badge-info" style={{ marginBottom: '8px' }}>Agendamento</span>
              <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>
                Reservar {selectedSpace.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Consulte no calendário abaixo os horários disponíveis para a data desejada.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '32px'
            }} className="calendar-grid-layout">
              {/* Calendário */}
              <Calendar
                spaceId={selectedSpace.id}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onTimeSlotSelect={setSelectedTimeSlot}
              />

              {/* Box de Confirmação Lateral */}
              {selectedDate && selectedTimeSlot && (
                <div style={{
                  padding: '24px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  justifyContent: 'center'
                }} className="booking-summary-box">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BadgeInfo size={20} color="var(--primary)" /> Detalhes Escolhidos
                  </h4>
                  
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>Local:</strong> {selectedSpace.name}</div>
                    <div><strong>Data:</strong> {selectedDate.split('-').reverse().join('/')}</div>
                    <div><strong>Horário:</strong> {selectedTimeSlot.start} às {selectedTimeSlot.end}</div>
                  </div>

                  <button onClick={handleOpenBookingModal} className="btn btn-accent" style={{ height: '46px', width: '100%' }}>
                    {user ? 'Fazer Reserva' : 'Faça login para reservar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modal de checkout */}
      {showBookingModal && selectedSpace && selectedDate && selectedTimeSlot && (
        <BookingModal
          space={selectedSpace}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          user={user}
          token={token}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            setSelectedSpace(null);
            onNavigate('my-bookings');
          }}
        />
      )}

      <style>{`
        @media (min-width: 992px) {
          .calendar-grid-layout {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
