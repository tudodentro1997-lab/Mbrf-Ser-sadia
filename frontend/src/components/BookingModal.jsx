import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard, Landmark, QrCode, AlertCircle, Copy, Check } from 'lucide-react';

export default function BookingModal({ space, date, timeSlot, user, token, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Resumo, 2: Pagamento, 3: Sucesso
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Timer regressivo para expiração fictícia (15 minutos)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && step === 2) {
      setError('O tempo limite para pagamento expirou. O horário foi liberado.');
      setStep(1);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPrice = () => {
    if (user.role === 'SOCIO' && user.financialStatus === 'EM_DIA') {
      return space.priceSocio;
    }
    return space.priceNaoSocio;
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spaceId: space.id,
          date,
          startTime: timeSlot.start,
          endTime: timeSlot.end,
          paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar reserva.');
      }

      setBooking(data.booking);
      setPaymentDetails(data.paymentDetails);

      if (data.booking.status === 'CONFIRMADA') {
        // Reservas gratuitas ou admin já começam confirmadas
        setStep(3);
      } else {
        setStep(2); // Vai para a tela de pagamento
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'CONFIRMADA' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao confirmar pagamento.');
      }

      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(paymentDetails?.qrCodePix || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        padding: '0px',
        overflow: 'hidden'
      }}>
        {/* Header do Modal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
            {step === 1 && 'Confirmar sua Reserva'}
            {step === 2 && 'Efetuar Pagamento'}
            {step === 3 && 'Reserva Confirmada!'}
          </h3>
          {step !== 3 && (
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* PASSO 1: Resumo da Reserva */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.95rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div><strong>Local:</strong> {space.name}</div>
                <div><strong>Data:</strong> {date.split('-').reverse().join('/')}</div>
                <div><strong>Horário:</strong> {timeSlot.start} às {timeSlot.end} (2 horas)</div>
                <div><strong>Capacidade:</strong> até {space.capacity} pessoas</div>
              </div>

              {/* Diferenciação de Preço */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: 'var(--primary-light)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--primary)',
                fontWeight: 600
              }}>
                <span>Valor Cobrado:</span>
                <span style={{ fontSize: '1.25rem' }}>R$ {getPrice().toFixed(2)}</span>
              </div>

              {user.role === 'SOCIO' ? (
                user.financialStatus === 'EM_DIA' ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                    ✓ Desconto de sócio aplicado (Mensalidade em dia).
                  </p>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                    ⚠️ Valor de não-sócio cobrado devido a pendências na mensalidade.
                  </p>
                )
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Valor integral de não-sócio.
                </p>
              )}

              {/* Seleção do Método de Pagamento */}
              {getPrice() > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Forma de Pagamento</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PIX')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: paymentMethod === 'PIX' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                        borderColor: paymentMethod === 'PIX' ? 'var(--primary)' : 'var(--border-color)',
                        color: 'var(--primary)'
                      }}
                    >
                      <QrCode size={18} /> PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('STRIPE')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: paymentMethod === 'STRIPE' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                        borderColor: paymentMethod === 'STRIPE' ? 'var(--primary)' : 'var(--border-color)',
                        color: 'var(--primary)'
                      }}
                    >
                      <CreditCard size={18} /> Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MERCADO_PAGO')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        cursor: 'pointer',
                        fontWeight: 600,
                        backgroundColor: paymentMethod === 'MERCADO_PAGO' ? 'var(--primary-light)' : 'var(--bg-secondary)',
                        borderColor: paymentMethod === 'MERCADO_PAGO' ? 'var(--primary)' : 'var(--border-color)',
                        color: 'var(--primary)'
                      }}
                    >
                      <Landmark size={18} /> M. Pago
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleCreateBooking}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', height: '46px', marginTop: '12px' }}
              >
                {loading ? 'Processando...' : 'Confirmar e Ir para Pagamento'}
              </button>
            </div>
          )}

          {/* PASSO 2: Tela de Pagamento (PIX / Stripe / M. Pago Fictício) */}
          {step === 2 && booking && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{
                backgroundColor: 'var(--warning-light)',
                color: 'var(--warning)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Aguardando pagamento:</span>
                <span style={{ fontSize: '1rem' }}>{formatTime(timeLeft)}</span>
              </div>

              {paymentMethod === 'PIX' ? (
                <>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Escaneie o QR Code abaixo pelo aplicativo do seu banco ou copie a chave PIX Copia-e-Cola.
                  </p>
                  
                  {/* QR Code Fictício Visual */}
                  <div style={{
                    padding: '16px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',
                    width: '180px',
                    height: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Exibir ícone QR Code simulado */}
                    <QrCode size={140} color="#000000" />
                  </div>

                  {/* Chave PIX Copia-e-Cola */}
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-primary)'
                  }}>
                    <input
                      type="text"
                      readOnly
                      value={paymentDetails?.qrCodePix || ''}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '0.8rem',
                        textOverflow: 'ellipsis'
                      }}
                    />
                    <button
                      onClick={handleCopyPix}
                      style={{
                        border: 'none',
                        borderLeft: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-tertiary)',
                        padding: '10px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: copied ? 'var(--success)' : 'var(--text-secondary)'
                      }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </>
              ) : (
                /* Simulação de Stripe ou Mercado Pago */
                <div style={{
                  padding: '24px',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  width: '100%',
                  backgroundColor: 'var(--bg-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <CreditCard size={48} color="var(--primary)" />
                  <h4>Simulação de Gateway de Checkout ({paymentMethod})</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    O sistema MBRF/Sadia abrirá o checkout integrado para preenchimento de dados de cartão de crédito.
                  </p>
                </div>
              )}

              <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', marginTop: '12px', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Pagar Depois
                </button>
                <button
                  onClick={handleSimulatePaymentSuccess}
                  disabled={loading}
                  className="btn btn-accent"
                  style={{ flex: 1 }}
                >
                  {loading ? 'Confirmando...' : 'Simular Pagamento Aprovado'}
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3: Tela de Sucesso */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--success)',
                marginBottom: '8px'
              }}>
                <CheckCircle size={40} />
              </div>
              <h4 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>Tudo Certo!</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Sua reserva no <strong>{space.name}</strong> foi confirmada.
              </p>

              {booking && (
                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  marginTop: '4px'
                }}>
                  Código da Reserva: {booking.code}
                </div>
              )}

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Um e-mail de confirmação foi enviado. Apresente o código da reserva ao chegar ao local.
              </p>

              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="btn btn-primary"
                style={{ width: '100%', height: '46px', marginTop: '12px' }}
              >
                Ir para Minhas Reservas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
