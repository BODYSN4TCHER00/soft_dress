import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiEdit, FiStar, FiMinus, FiUsers, FiX, FiEye } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SharedLayout from '../../Components/shared/SharedLayout';
import AdminHeader from '../../Components/admin/AdminHeader';
import SummaryCard from '../../Components/shared/SummaryCard';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import { supabase } from '../../utils/supabase/client';
import '../../styles/Clientes.css';

interface Customer {
  id: number;
  name: string;
  last_name: string | null;
  phone: string | null;
  second_phone?: string | null;
  email: string | null;
  address?: string | null;
  created_at: string;
  blacklisted: string | null;
  ine_url: string | null;
  isFrequent?: boolean;
}

const Clientes = () => {
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Todos' | 'Lista Negra' | 'Clientes Frecuentes'>('Todos');
  const [frequentCount, setFrequentCount] = useState(0);
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [selectedINEUrl, setSelectedINEUrl] = useState<string | null>(null);
  const [isINEModalOpen, setIsINEModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    // Verificar si hay estado de navegación
    if (location.state) {
      const state = location.state as { filter?: string; highlightCustomerId?: number };
      if (state.filter) {
        setActiveFilter(state.filter as 'Todos' | 'Lista Negra' | 'Clientes Frecuentes');
      }
    }
    loadCustomers();
  }, [location.state]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      // Ejecutar ambas queries en paralelo
      const [customersResult, rentalsResult] = await Promise.all([
        supabase
          .from('Customers')
          .select('id, name, last_name, phone, second_phone, email, address, created_at, blacklisted, ine_url')
          .order('created_at', { ascending: false }),
        supabase
          .from('Orders')
          .select('customer_id')
      ]);

      if (customersResult.error) {
        toast.error('Error al cargar clientes');
        return;
      }

      if (customersResult.data) {
        // Contar rentas por cliente de forma eficiente
        const rentalCounts: { [key: number]: number } = {};
        if (rentalsResult.data) {
          rentalsResult.data.forEach(order => {
            if (order.customer_id) {
              rentalCounts[order.customer_id] = (rentalCounts[order.customer_id] || 0) + 1;
            }
          });
        }

        const customersWithFrequent = customersResult.data.map((customer) => {
          const rentalCount = rentalCounts[customer.id] || 0;
          return {
            ...customer,
            isFrequent: rentalCount >= 2,
          };
        });

        setCustomers(customersWithFrequent);
        setFrequentCount(customersWithFrequent.filter(c => c.isFrequent).length);
        setBlacklistCount(customersWithFrequent.filter(c => c.blacklisted === 'true' || c.blacklisted === 'blacklisted').length);
      }
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleGenerateReport = () => {
    toast.success('Generando reporte...');
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'Lista Negra') {
      return matchesSearch && (customer.blacklisted === 'true' || customer.blacklisted === 'blacklisted');
    }
    if (activeFilter === 'Clientes Frecuentes') {
      return matchesSearch && customer.isFrequent;
    }
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleViewINE = (customer: Customer) => {
    if (!customer.ine_url) {
      toast.error('Este cliente no tiene INE registrado');
      return;
    }
    setSelectedINEUrl(customer.ine_url);
    setIsINEModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleBlacklist = async (customer: Customer) => {
    const isBlacklisted = customer.blacklisted === 'true' || customer.blacklisted === 'blacklisted';
    const newBlacklistStatus = isBlacklisted ? null : 'true';

    try {
      const { error } = await supabase
        .from('Customers')
        .update({ blacklisted: newBlacklistStatus })
        .eq('id', customer.id);

      if (error) {
        toast.error('Error al actualizar el estado de lista negra');
        return;
      }

      toast.success(isBlacklisted ? 'Cliente removido de la lista negra' : 'Cliente agregado a la lista negra');
      loadCustomers();
    } catch (error) {
      toast.error('Error al actualizar el estado de lista negra');
    }
  };

  const handleSaveEdit = async (updatedCustomer: Customer) => {
    try {
      const { error } = await supabase
        .from('Customers')
        .update({
          name: updatedCustomer.name,
          last_name: updatedCustomer.last_name,
          phone: updatedCustomer.phone,
          second_phone: updatedCustomer.second_phone,
          email: updatedCustomer.email,
          domicilio: updatedCustomer.address,
        })
        .eq('id', updatedCustomer.id);

      if (error) {
        toast.error('Error al actualizar el cliente');
        return;
      }

      toast.success('Cliente actualizado exitosamente');
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      toast.error('Error al actualizar el cliente');
    }
  };

  return (
    <SharedLayout>
      <div className="clientes-container">
        <AdminHeader 
          onSearch={handleSearch}
          onGenerateReport={handleGenerateReport}
          searchValue={searchQuery}
        />

        <main className="clientes-main">
          <h1 className="clientes-title">Lista de Clientes</h1>

          <div className="summary-cards">
            <SummaryCard
              title="Total de Clientes"
              value={customers.length}
              icon={<FiUsers />}
              variant="default"
            />
            <SummaryCard
              title="Clientes Frecuentes"
              value={frequentCount}
              icon={<FiStar />}
              variant="frequent"
            />
            <SummaryCard
              title="Lista Negra"
              value={blacklistCount}
              icon={<FiMinus />}
              variant="blacklist"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeFilter === 'Lista Negra' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Lista Negra')}
            >
              Lista Negra
            </button>
            <button
              className={`filter-tab ${activeFilter === 'Clientes Frecuentes' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Clientes Frecuentes')}
            >
              Clientes Frecuentes
            </button>
            <button
              className={`filter-tab ${activeFilter === 'Todos' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Todos')}
            >
              Todos
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Cargando clientes..." />
          ) : (
            <div className="table-container">
              <table className="clientes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Telefono</th>
                    <th>Segundo Telefono</th>
                    <th>Domicilio</th>
                    <th>Fecha de Creacion:</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">
                        No hay clientes para mostrar
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div className="name-cell">
                            {customer.isFrequent && (
                              <FiStar className="frequent-icon" />
                            )}
                            {(customer.blacklisted === 'true' || customer.blacklisted === 'blacklisted') && (
                              <div className="blacklist-icon">
                                <FiMinus />
                              </div>
                            )}
                            {customer.name} {customer.last_name || ''}
                          </div>
                        </td>
                        <td>{customer.phone || 'N/A'}</td>
                        <td>{customer.second_phone || 'N/A'}</td>
                        <td>{customer.address || 'N/A'}</td>
                        <td>{formatDate(customer.created_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn yellow" 
                              title="Ver INE"
                              onClick={() => handleViewINE(customer)}
                            >
                              <FiEye />
                            </button>
                            <button 
                              className="action-btn blue" 
                              title="Editar"
                              onClick={() => handleEdit(customer)}
                            >
                              <FiEdit />
                            </button>
                            <button 
                              className={`action-btn ${(customer.blacklisted === 'true' || customer.blacklisted === 'blacklisted') ? 'blacklisted' : 'black'}`}
                              title={(customer.blacklisted === 'true' || customer.blacklisted === 'blacklisted') ? 'Remover de lista negra' : 'Agregar a lista negra'}
                              onClick={() => handleBlacklist(customer)}
                            >
                              <FiMinus />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Modal para mostrar INE */}
        {isINEModalOpen && selectedINEUrl && (
          <div className="modal-overlay" onClick={() => setIsINEModalOpen(false)}>
            <div className="modal-content ine-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">INE del Cliente</h2>
                <button className="modal-close" onClick={() => setIsINEModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <img 
                  src={selectedINEUrl} 
                  alt="INE del cliente" 
                  className="ine-image"
                  onError={() => {
                    toast.error('Error al cargar la imagen del INE');
                    setIsINEModalOpen(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar cliente */}
        {isEditModalOpen && editingCustomer && (
          <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
            <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Editar Cliente</h2>
                <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit(editingCustomer);
                }}>
                  <div className="form-group">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Apellido</label>
                    <input
                      type="text"
                      value={editingCustomer.last_name || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, last_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      value={editingCustomer.phone || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Segundo Teléfono</label>
                    <input
                      type="text"
                      value={editingCustomer.second_phone || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, second_phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editingCustomer.email || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Domicilio</label>
                    <input
                      type="text"
                      value={editingCustomer.address || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-save">
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default Clientes;

