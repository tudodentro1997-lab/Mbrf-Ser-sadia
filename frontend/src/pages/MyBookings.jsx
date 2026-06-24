import React, { useState, useEffect } from 'react';
import { Calendar, Receipt, XCircle, CreditCard, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import BookingModal from '../components/BookingModal';

export default function MyBookings({ token, user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Para pagar reserva pendente posteriormente
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/bookings/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        throw new Error('Falha ao carregar suas reservas.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'CANCELADA' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar reserva.');
      }

      alert('Reserva cancelada com sucesso!');
      fetchMyBookings(); // Recarrega
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMADA':
        return <span className="badge badge-success">Confirmada</span>;
      case 'AGUARDANDO_PAGAMENTO':
        return <span className="badge badge-warning">Aguardando Pagto</span>;
      case 'CANCELADA':
        return <span className="badge badge-danger">Cancelada</span>;
      case 'EXPIRADA':
        return <span className="badge badge-danger" style={{ opacity: 0.6 }}>Expirada</span>;
      case 'PENDENTE':
      default:
        return <span className="badge badge-info">Pendente</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)' }}>Minhas Reservas</h1>
        <p style={{ color: 'var(--text-muted)' }}>Acompanhe o status e histórico dos seus agendamentos na associação.</p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <h3>Nenhuma reserva encontrada</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Você ainda não realizou nenhuma reserva de espaço no portal.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map((booking) => (
            <div key={booking.id} className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              position: 'relative'
            }} className="booking-card">
              
              {/* Top info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '16px'
              }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CÓDIGO: {booking.code}</span>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                    {booking.space.name}
                  </h3>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              {/* Middle details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                fontSize: '0.9rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Data Reservada</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {booking.date.split('-').reverse().join('/')}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Horário do Evento</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {booking.startTime} às {booking.endTime} (2h)
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Forma de Pagamento</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {booking.paymentMethod || 'Não selecionado'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Valor da Reserva</span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                    {booking.totalAmount === 0 ? 'Grátis' : `R$ ${booking.totalAmount.toFixed(2)}`}
                  </strong>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '16px',
                marginTop: '4px'
              }}>
                {booking.status === 'AGUARDANDO_PAGAMENTO' && (
                  <>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="btn btn-secondary"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                    >
                      <XCircle size={16} /> Cancelar Reserva
                    </button>
                    <button
                      onClick={() => setSelectedBookingForPayment(booking)}
                      className="btn btn-primary"
                    >
                      <CreditCard size={16} /> Pagar Agora
                    </button>
                  </>
                )}

                {booking.status === 'CONFIRMADA' && (
                  <button
                    onClick={() => alert(`Recibo de Reserva ${booking.code}\nLocal: ${booking.space.name}\nData: ${booking.date}\nValor: R$ ${booking.totalAmount.toFixed(2)}\nStatus: CONFIRMADA`)}
                    className="btn btn-secondary"
                  >
                    <Receipt size={16} /> Ver Recibo
                  </button>
                )}

                {booking.status === 'PENDENTE' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="btn btn-secondary"
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                  >
                    <XCircle size={16} /> Cancelar Reserva
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para pagar reserva pendente */}
      {selectedBookingForPayment && (
        <BookingModal
          space={selectedBookingForPayment.space}
          date={selectedBookingForPayment.date}
          timeSlot={{ start: selectedBookingForPayment.startTime, end: selectedBookingForPayment.endTime }}
          user={user}
          token={token}
          onClose={() => setSelectedBookingForPayment(null)}
          onSuccess={() => {
            setSelectedBookingForPayment(null);
            fetchMyBookings();
          }}
        />
      )}

      <style>{`
        .booking-card:hover {
          transform: none !important;
          box-shadow: var(--shadow-md) !important;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
