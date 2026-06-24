import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, Users, Building, ShieldAlert, 
  Upload, UserPlus, ToggleLeft, ToggleRight, DollarSign, 
  Check, X, FileSpreadsheet, RefreshCw, HelpCircle, Lock 
} from 'lucide-react';

export default function AdminDashboard({ token, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [users, setUsers] = useState([]);

  // Estados de formulário de Espaço
  const [editingSpace, setEditingSpace] = useState(null);
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceCap, setSpaceCap] = useState(50);
  const [spaceRules, setSpaceRules] = useState('');
  const [spacePriceSocio, setSpacePriceSocio] = useState(0);
  const [spacePriceNao, setSpacePriceNao] = useState(100);
  const [spaceFiles, setSpaceFiles] = useState([]);
  const [existingSpaceImages, setExistingSpaceImages] = useState([]);

  // Estados de cadastro de sócio
  const [socioName, setSocioName] = useState('');
  const [socioCpf, setSocioCpf] = useState('');
  const [socioEmail, setSocioEmail] = useState('');
  const [socioPhone, setSocioPhone] = useState('');
  const [socioMatricula, setSocioMatricula] = useState('');
  const [socioFinStatus, setSocioFinStatus] = useState('EM_DIA');

  // Estados de importação CSV
  const [csvFile, setCsvFile] = useState(null);
  const [csvStatus, setCsvStatus] = useState(null);

  // Estados de Bloqueio Manual
  const [blockSpaceId, setBlockSpaceId] = useState('');
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('08:00');
  const [blockEnd, setBlockEnd] = useState('22:00');
  const [blockReason, setBlockReason] = useState('Manutenção Programada');

  // Loading global
  const [loading, setLoading] = useState(false);

  // Carregar dados dependendo da tab ativa
  useEffect(() => {
    if (activeTab === 'dashboard') fetchStats();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'spaces') fetchSpaces();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSpaces = async () => {
    try {
      const response = await fetch('/api/spaces?includeInactive=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSpaces(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Alterar Status da Reserva
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    if (!window.confirm(`Mudar status desta reserva para ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Reserva atualizada!');
        fetchBookings();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Criar / Editar Espaço
  const handleSaveSpace = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', spaceName);
    formData.append('description', spaceDesc);
    formData.append('capacity', Number(spaceCap));
    formData.append('rules', spaceRules);
    formData.append('priceSocio', Number(spacePriceSocio));
    formData.append('priceNaoSocio', Number(spacePriceNao));
    formData.append('keepImages', JSON.stringify(existingSpaceImages));

    for (let i = 0; i < spaceFiles.length; i++) {
      formData.append('images', spaceFiles[i]);
    }

    try {
      let response;
      if (editingSpace) {
        response = await fetch(`/api/spaces/${editingSpace.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      } else {
        response = await fetch('/api/spaces', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
      }

      if (response.ok) {
        alert(editingSpace ? 'Espaço editado com sucesso!' : 'Espaço criado com sucesso!');
        setEditingSpace(null);
        resetSpaceForm();
        fetchSpaces();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpaceActive = async (space) => {
    try {
      const response = await fetch(`/api/spaces/${space.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !space.isActive })
      });

      if (response.ok) {
        fetchSpaces();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditSpace = (space) => {
    setEditingSpace(space);
    setSpaceName(space.name);
    setSpaceDesc(space.description);
    setSpaceCap(space.capacity);
    setSpaceRules(space.rules || '');
    setSpacePriceSocio(space.priceSocio);
    setSpacePriceNao(space.priceNaoSocio);
    const urls = Array.isArray(space.imageUrls) ? space.imageUrls : [];
    setExistingSpaceImages(urls);
    setSpaceFiles([]);
  };

  const resetSpaceForm = () => {
    setEditingSpace(null);
    setSpaceName('');
    setSpaceDesc('');
    setSpaceCap(50);
    setSpaceRules('');
    setSpacePriceSocio(0);
    setSpacePriceNao(100);
    setSpaceFiles([]);
    setExistingSpaceImages([]);
  };

  // Cadastrar Sócio Individual
  const handleRegisterSocio = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users/socio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: socioName,
          cpf: socioCpf,
          email: socioEmail,
          phone: socioPhone,
          matricula: socioMatricula,
          financialStatus: socioFinStatus
        })
      });

      if (response.ok) {
        alert('Sócio cadastrado com sucesso!');
        setSocioName('');
        setSocioCpf('');
        setSocioEmail('');
        setSocioPhone('');
        setSocioMatricula('');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Alterar Inadimplência/Status Financeiro
  const handleToggleFinancialStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'EM_DIA' ? 'EM_ATRASO' : 'EM_DIA';
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ financialStatus: nextStatus })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Importar CSV Sócios
  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setLoading(true);
    setCsvStatus(null);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await fetch('/api/users/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setCsvStatus({
          success: true,
          message: data.message,
          summary: data.summary,
          errors: data.errors
        });
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bloqueio Manual
  const handleBlockManual = async (e) => {
    e.preventDefault();
    if (!blockSpaceId) {
      alert('Selecione um espaço.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bookings/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spaceId: blockSpaceId,
          date: blockDate,
          startTime: blockStart,
          endTime: blockEnd,
          reason: blockReason
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setBlockDate('');
        setBlockReason('Manutenção Programada');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'CONFIRMADA') return 'badge badge-success';
    if (status === 'AGUARDANDO_PAGAMENTO') return 'badge badge-warning';
    if (status === 'CANCELADA') return 'badge badge-danger';
    return 'badge badge-info';
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Painel de Controle Administrativo
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie espaços, reservas, sócios e consulte relatórios financeiros.</p>
      </div>

      {/* Tabs de Navegação */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        marginBottom: '32px',
        overflowX: 'auto'
      }}>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart3 size={18} /> Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('bookings')} 
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Calendar size={18} /> Reservas
        </button>
        <button 
          onClick={() => setActiveTab('spaces')} 
          className={`btn ${activeTab === 'spaces' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Building size={18} /> Locais/Espaços
        </button>
        <button 
          onClick={() => setActiveTab('users')} 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={18} /> Sócios & Usuários
        </button>
        <button 
          onClick={() => { setActiveTab('block'); fetchSpaces(); }} 
          className={`btn ${activeTab === 'block' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Lock size={18} /> Bloquear Data
        </button>
      </div>

      {/* ==================== TAB 1: DASHBOARD (ESTATÍSTICAS) ==================== */}
      {activeTab === 'dashboard' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
          {/* Grid de Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '16px', borderRadius: '12px' }}>
                <Calendar size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Total de Reservas</span>
                <strong style={{ fontSize: '1.75rem' }}>{stats.totalBookings}</strong>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '16px', borderRadius: '12px' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Total Arrecadado</span>
                <strong style={{ fontSize: '1.75rem', color: 'var(--success)' }}>R$ {stats.totalRevenue.toFixed(2)}</strong>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '16px', borderRadius: '12px' }}>
                <Calendar size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Reservas do Mês</span>
                <strong style={{ fontSize: '1.75rem' }}>{stats.monthBookings}</strong>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)', padding: '16px', borderRadius: '12px' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Sócios Ativos</span>
                <strong style={{ fontSize: '1.75rem' }}>{stats.activeSocios}</strong>
              </div>
            </div>
          </div>

          {/* Utilização de Locais */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Locais Mais Reservados (Confirmados)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stats.spaceUsage.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Sem dados de utilização ainda.</p>
              ) : (
                stats.spaceUsage.map((item, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>{item.spaceName}</span>
                      <span>{item.bookingCount} reserva(s)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min((item.bookingCount / (stats.totalBookings || 1)) * 100, 100)}%`, 
                        height: '100%', 
                        backgroundColor: 'var(--primary)' 
                      }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: GERENCIAR RESERVAS ==================== */}
      {activeTab === 'bookings' && (
        <div className="card animate-fade-in" style={{ overflowX: 'auto', padding: '0px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }}>Cód</th>
                <th style={{ padding: '16px' }}>Usuário</th>
                <th style={{ padding: '16px' }}>Local</th>
                <th style={{ padding: '16px' }}>Data/Horário</th>
                <th style={{ padding: '16px' }}>Preço</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma reserva cadastrada.</td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{b.code}</td>
                    <td style={{ padding: '16px' }}>
                      <div>{b.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.user.cpf} - {b.userType}</div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{b.space.name}</td>
                    <td style={{ padding: '16px' }}>
                      <div>{b.date.split('-').reverse().join('/')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.startTime} - {b.endTime}</div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>R$ {b.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}><span className={getStatusClass(b.status)}>{b.status}</span></td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {(b.status === 'PENDENTE' || b.status === 'AGUARDANDO_PAGAMENTO') && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMADA')}
                            className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Confirmar Pagamento Manualmente"
                          >
                            <Check size={14} /> Confirmar
                          </button>
                        )}
                        {b.status !== 'CANCELADA' && b.status !== 'EXPIRADA' && (
                          <button 
                            onClick={() => handleUpdateBookingStatus(b.id, 'CANCELADA')}
                            className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                            title="Cancelar Reserva"
                          >
                            <X size={14} /> Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== TAB 3: GERENCIAR ESPAÇOS ==================== */}
      {activeTab === 'spaces' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="calendar-grid-layout animate-fade-in">
          {/* Lista de Espaços */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Locais Cadastrados</h3>
            {spaces.map(space => (
              <div key={space.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem' }}>{space.name} {!space.isActive && <span className="badge badge-danger">Inativo</span>}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Capacidade: {space.capacity} pessoas</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleToggleSpaceActive(space)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title={space.isActive ? 'Desativar local' : 'Ativar local'}
                  >
                    {space.isActive ? <ToggleRight size={32} color="var(--success)" /> : <ToggleLeft size={32} color="var(--text-muted)" />}
                  </button>
                  <button onClick={() => startEditSpace(space)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form de Edição / Criação */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
              {editingSpace ? 'Editar Local' : 'Criar Novo Local'}
            </h3>
            <form onSubmit={handleSaveSpace} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nome do Local</label>
                <input 
                  type="text" required value={spaceName} onChange={(e) => setSpaceName(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Descrição</label>
                <textarea 
                  required value={spaceDesc} onChange={(e) => setSpaceDesc(e.target.value)} rows={3}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Capacidade Máxima</label>
                  <input 
                    type="number" required value={spaceCap} onChange={(e) => setSpaceCap(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Regras de Utilização</label>
                  <input 
                    type="text" value={spaceRules} onChange={(e) => setSpaceRules(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Preço para Sócio</label>
                  <input 
                    type="number" required value={spacePriceSocio} onChange={(e) => setSpacePriceSocio(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Preço para Não Sócio</label>
                  <input 
                    type="number" required value={spacePriceNao} onChange={(e) => setSpacePriceNao(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fotos do Local (Arquivos de Imagem)</label>
                
                {/* Imagens que já estão no banco de dados */}
                {editingSpace && existingSpaceImages.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fotos atuais (Clique em X para remover):</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {existingSpaceImages.map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img 
                            src={url} 
                            alt="Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' }}
                          />
                          <button
                            type="button"
                            onClick={() => setExistingSpaceImages(prev => prev.filter(item => item !== url))}
                            style={{
                              position: 'absolute',
                              top: '2px',
                              right: '2px',
                              backgroundColor: 'rgba(239, 68, 68, 0.85)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '10px',
                              lineHeight: 1
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selecionar novos arquivos locais */}
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={(e) => setSpaceFiles(Array.from(e.target.files || []))}
                  style={{
                    padding: '8px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-primary)',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '0.8rem'
                  }}
                />

                {/* Lista de novos arquivos selecionados */}
                {spaceFiles.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                    {spaceFiles.length} arquivo(s) selecionado(s):
                    <ul style={{ paddingLeft: '14px', marginTop: '2px' }}>
                      {spaceFiles.map((file, idx) => <li key={idx}>{file.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {editingSpace ? 'Salvar Alterações' : 'Criar Local'}
                </button>
                {editingSpace && (
                  <button type="button" onClick={resetSpaceForm} className="btn btn-secondary">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: GERENCIAR SÓCIOS / IMPORTAÇÃO CSV ==================== */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
          
          {/* Seção Cadastro Individual e Importação CSV lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="calendar-grid-layout">
            
            {/* Cadastro de Sócio */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="var(--primary)" /> Cadastrar Sócio Individual
              </h3>
              <form onSubmit={handleRegisterSocio} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nome Completo</label>
                  <input 
                    type="text" required value={socioName} onChange={(e) => setSocioName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>CPF</label>
                    <input 
                      type="text" required placeholder="Apenas números" value={socioCpf} onChange={(e) => setSocioCpf(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Matrícula MBRF</label>
                    <input 
                      type="text" required placeholder="Ex: MBRF-1234" value={socioMatricula} onChange={(e) => setSocioMatricula(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>E-mail</label>
                    <input 
                      type="email" required value={socioEmail} onChange={(e) => setSocioEmail(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Telefone</label>
                    <input 
                      type="text" value={socioPhone} onChange={(e) => setSocioPhone(e.target.value)}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Situação Financeira</label>
                  <select 
                    value={socioFinStatus} onChange={(e) => setSocioFinStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <option value="EM_DIA">Em Dia (Paga preço de Sócio)</option>
                    <option value="EM_ATRASO">Inadimplente (Paga preço cheio)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', height: '42px' }} disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar Sócio'}
                </button>
              </form>
            </div>

            {/* Importação CSV */}
            <div className="card">
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="var(--accent)" /> Importação em Massa (CSV)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Envie um arquivo CSV contendo cabeçalhos: `nome`, `cpf`, `email`, `matricula`, `telefone` e `situacao_financeira`.
              </p>
              
              <form onSubmit={handleImportCSV} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="file" accept=".csv" required
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  style={{
                    padding: '12px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px',
                    width: '100%',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                />
                
                <button type="submit" className="btn btn-accent" style={{ height: '42px' }} disabled={loading || !csvFile}>
                  <Upload size={16} /> Importar Planilha de Sócios
                </button>
              </form>

              {/* Resultado do Upload */}
              {csvStatus && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--success)' }}>
                    {csvStatus.message}
                  </strong>
                  <div>Sucessos: {csvStatus.summary.success}</div>
                  <div>Falhas: {csvStatus.summary.failed}</div>
                  {csvStatus.errors.length > 0 && (
                    <div style={{ marginTop: '10px', maxHeight: '100px', overflowY: 'auto', color: 'var(--danger)' }}>
                      <strong>Erros detalhados:</strong>
                      <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                        {csvStatus.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Usuários */}
          <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)' }}>Usuários Registrados</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px' }}>Nome</th>
                  <th style={{ padding: '16px' }}>CPF</th>
                  <th style={{ padding: '16px' }}>E-mail</th>
                  <th style={{ padding: '16px' }}>Perfil / Matrícula</th>
                  <th style={{ padding: '16px' }}>Situação Finan.</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '16px' }}>{u.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                    <td style={{ padding: '16px' }}>{u.email}</td>
                    <td style={{ padding: '16px' }}>
                      <span className={u.role === 'SOCIO' ? 'badge badge-success' : u.role === 'ADMIN' ? 'badge badge-danger' : 'badge badge-info'}>
                        {u.role}
                      </span>
                      {u.matricula && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Matrícula: {u.matricula}</div>}
                    </td>
                    <td style={{ padding: '16px' }}>
                      {u.role === 'SOCIO' ? (
                        <span className={u.financialStatus === 'EM_DIA' ? 'badge badge-success' : 'badge badge-warning'}>
                          {u.financialStatus === 'EM_DIA' ? 'Em dia' : 'Em atraso'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {u.role === 'SOCIO' && (
                        <button 
                          onClick={() => handleToggleFinancialStatus(u.id, u.financialStatus)}
                          className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          Alterar Situação
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: BLOQUEIO MANUAL ==================== */}
      {activeTab === 'block' && (
        <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="var(--warning)" /> Bloquear Agenda de um Espaço
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Utilize esta tela para fechar datas específicas do calendário (ex: feriados, manutenções locais, reformas).
          </p>

          <form onSubmit={handleBlockManual} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Selecione o Espaço</label>
              <select 
                required value={blockSpaceId} onChange={(e) => setBlockSpaceId(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              >
                <option value="">-- Selecione o Local --</option>
                {spaces.filter(s => s.isActive).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Data do Bloqueio</label>
              <input 
                type="date" required min={new Date().toISOString().split('T')[0]}
                value={blockDate} onChange={(e) => setBlockDate(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Hora Início</label>
                <input 
                  type="time" required value={blockStart} onChange={(e) => setBlockStart(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Hora Fim</label>
                <input 
                  type="time" required value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Motivo do Bloqueio</label>
              <input 
                type="text" required value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Reforma da churrasqueira"
                style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '46px', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Bloqueando...' : 'Efetuar Bloqueio na Agenda'}
            </button>
          </form>
        </div>
      )}

      <style>{`
        th, td {
          border-bottom: 1px solid var(--border-color);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
