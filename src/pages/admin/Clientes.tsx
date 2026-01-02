import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiStar, FiMinus, FiUsers, FiX, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SharedLayout from '../../Components/shared/SharedLayout';
import AdminHeader from '../../Components/admin/AdminHeader';
import SummaryCard from '../../Components/shared/SummaryCard';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import CustomerActionsMenu from '../../Components/shared/CustomerActionsMenu';
import { supabase } from '../../utils/supabase/client';
import '../../styles/Clientes.css';

export type CustomerStatus = 'active' | 'inactive' | 'blacklisted' | 'frecuent_customer';

export interface Customer {
  id: number;
  name: string;
  last_name: string | null;
  phone: string | null;
  second_phone?: string | null;
  email: string | null;
  address?: string | null;
  created_at: string;
  status: CustomerStatus | null;
  ine_url: string | null;
  rental_count?: number;
}

interface RentalHistory {
  id: string;
  delivery_date: string;
  due_date: string | null;
  status: string;
  product_name: string;
  total: number;
}

const Clientes = () => {
  const location = useLocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [frequentCount, setFrequentCount] = useState(0);
  const [blacklistCount, setBlacklistCount] = useState(0);
  const [selectedINEUrl, setSelectedINEUrl] = useState<string | null>(null);
  const [isINEModalOpen, setIsINEModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerRentals, setCustomerRentals] = useState<RentalHistory[]>([]);
  const [isRentalHistoryModalOpen, setIsRentalHistoryModalOpen] = useState(false);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [expandedRentals, setExpandedRentals] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<'blacklist' | 'frequent'>>(new Set());

  useEffect(() => {
    // Verificar si hay estado de navegación
    if (location.state) {
      const state = location.state as { filter?: string; highlightCustomerId?: number };
      if (state.filter) {
        // Set active filters based on navigation state
        if (state.filter === 'Lista Negra') {
          setActiveFilters(new Set(['blacklist']));
        } else if (state.filter === 'Clientes Frecuentes') {
          setActiveFilters(new Set(['frequent']));
        }
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
          .select('id, name, last_name, phone, second_phone, email, address, created_at, status, ine_url')
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

        const customersWithCount = customersResult.data.map((customer) => {
          const rentalCount = rentalCounts[customer.id] || 0;
          return {
            ...customer,
            rental_count: rentalCount,
          };
        });

        // Auto-assign frequent customer status for customers with 3+ rentals
        const customersToUpdate = customersWithCount.filter(
          c => c.rental_count >= 3 && c.status !== 'frecuent_customer' && c.status !== 'blacklisted'
        );

        if (customersToUpdate.length > 0) {
          // Update customers to frequent status
          const updatePromises = customersToUpdate.map(c =>
            supabase
              .from('Customers')
              .update({ status: 'frecuent_customer' })
              .eq('id', c.id)
          );

          await Promise.all(updatePromises);

          // Update local state to reflect changes
          customersWithCount.forEach(c => {
            if (c.rental_count >= 3 && c.status !== 'blacklisted') {
              c.status = 'frecuent_customer';
            }
          });
        }

        setCustomers(customersWithCount);
        setFrequentCount(customersWithCount.filter(c => c.status === 'frecuent_customer').length);
        setBlacklistCount(customersWithCount.filter(c => c.status === 'blacklisted').length);
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

  const handleStatusChange = async (customer: Customer, newStatus: CustomerStatus) => {
    try {
      const { error } = await supabase
        .from('Customers')
        .update({ status: newStatus })
        .eq('id', customer.id);

      if (error) {
        toast.error('Error al actualizar el estado del cliente');
        return;
      }

      const statusLabels: Record<CustomerStatus, string> = {
        'active': 'activo',
        'inactive': 'inactivo',
        'blacklisted': 'lista negra',
        'frecuent_customer': 'cliente frecuente'
      };

      toast.success(`Cliente marcado como ${statusLabels[newStatus]}`);
      loadCustomers();
    } catch (error) {
      toast.error('Error al actualizar el estado del cliente');
    }
  };

  const handleToggleBlacklist = async (customer: Customer) => {
    const isCurrentlyBlacklisted = customer.status === 'blacklisted';
    const newStatus: CustomerStatus = isCurrentlyBlacklisted ? 'active' : 'blacklisted';
    await handleStatusChange(customer, newStatus);
  };

  const handleToggleFrequentCustomer = async (customer: Customer) => {
    const isCurrentlyFrequent = customer.status === 'frecuent_customer';
    const newStatus: CustomerStatus = isCurrentlyFrequent ? 'active' : 'frecuent_customer';
    await handleStatusChange(customer, newStatus);
  };

  const toggleFilter = (filter: 'blacklist' | 'frequent') => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  const toggleSort = (sortType: 'name' | 'date') => {
    if (sortBy === sortType) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortType);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedCustomers = customers
    .filter(customer => {
      const matchesSearch =
        customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone?.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // If no filters are active, just match search
      if (activeFilters.size === 0) {
        return matchesSearch;
      }

      // Check if customer matches any active filter
      const matchesBlacklist = activeFilters.has('blacklist') && customer.status === 'blacklisted';
      const matchesFrequent = activeFilters.has('frequent') && customer.status === 'frecuent_customer';

      // Customer must match search AND at least one active filter
      return matchesSearch && (matchesBlacklist || matchesFrequent);
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        const nameA = (a.name + ' ' + (a.last_name || '')).toLowerCase();
        const nameB = (b.name + ' ' + (b.last_name || '')).toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
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
          address: updatedCustomer.address,
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

  const loadCustomerRentals = async (customerId: number) => {
    try {
      setLoadingRentals(true);
      const { data, error } = await supabase
        .from('Orders')
        .select(`
          id,
          delivery_date,
          due_date,
          status,
          advance_payment,
          penalty_fee,
          Products!product_id(name)
        `)
        .eq('customer_id', customerId)
        .order('delivery_date', { ascending: false });

      if (error) {
        toast.error('Error al cargar historial de rentas');
        return;
      }

      if (data) {
        const rentals: RentalHistory[] = data.map((order: any) => ({
          id: order.id,
          delivery_date: order.delivery_date,
          due_date: order.due_date,
          status: order.status,
          total: (order.advance_payment || 0) + (order.penalty_fee || 0),
          product_name: order.Products?.name || 'Desconocido',
        }));
        setCustomerRentals(rentals);
      }
    } catch (error) {
      toast.error('Error al cargar historial de rentas');
    } finally {
      setLoadingRentals(false);
    }
  };

  const handleCustomerClick = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsRentalHistoryModalOpen(true);
    setExpandedRentals(new Set());
    await loadCustomerRentals(customer.id);
  };

  const toggleRentalExpand = (rentalId: string) => {
    setExpandedRentals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rentalId)) {
        newSet.delete(rentalId);
      } else {
        newSet.add(rentalId);
      }
      return newSet;
    });
  };

  return (
    <SharedLayout>
      <div className="clientes-container">
        <AdminHeader
          onSearch={handleSearch}
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
              onClick={() => toggleFilter('frequent')}
            />
            <SummaryCard
              title="Lista Negra"
              value={blacklistCount}
              icon={<FiMinus />}
              variant="blacklist"
              onClick={() => toggleFilter('blacklist')}
            />
          </div>

          <div className="controls-bar">
            <div className="sort-controls">
              <span className="controls-label">Ordenar por:</span>
              <button
                className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                onClick={() => toggleSort('name')}
              >
                Nombre
                {sortBy === 'name' && (
                  <span className="sort-arrow">{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </button>
              <button
                className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => toggleSort('date')}
              >
                Fecha
                {sortBy === 'date' && (
                  <span className="sort-arrow">{sortOrder === 'asc' ? ' ↑' : ' ↓'}</span>
                )}
              </button>
            </div>

            {activeFilters.size > 0 && (
              <div className="active-filters">
                <span className="controls-label">Filtros activos:</span>
                {activeFilters.has('frequent') && (
                  <span className="filter-tag frequent">
                    Clientes Frecuentes
                    <button onClick={() => toggleFilter('frequent')}>×</button>
                  </span>
                )}
                {activeFilters.has('blacklist') && (
                  <span className="filter-tag blacklist">
                    Lista Negra
                    <button onClick={() => toggleFilter('blacklist')}>×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-container">
              <table className="clientes-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono Principal</th>
                    <th>Teléfono Secundario</th>
                    <th>Rentas</th>
                    <th>Domicilio</th>
                    <th>Fecha de Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="no-data">
                        No hay clientes para mostrar
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="clickable-row"
                        onClick={() => handleCustomerClick(customer)}
                      >
                        <td>
                          <div className="name-cell">
                            {customer.status === 'frecuent_customer' && (
                              <div className="frequent-customer-icon">
                                <FiStar />
                              </div>
                            )}
                            {customer.status === 'blacklisted' && (
                              <div className="blacklist-icon">
                                <FiMinus />
                              </div>
                            )}
                            {customer.name} {customer.last_name || ''}
                          </div>
                        </td>
                        <td>{customer.phone || 'N/A'}</td>
                        <td>{customer.second_phone || 'N/A'}</td>
                        <td className="rental-count-cell">
                          <span className="rental-count-badge">
                            {customer.rental_count || 0}
                          </span>
                        </td>
                        <td>{customer.address || 'N/A'}</td>
                        <td>{formatDate(customer.created_at)}</td>
                        <td>
                          <div className="action-buttons">
                            <CustomerActionsMenu
                              customer={customer}
                              onEdit={handleEdit}
                              onViewINE={handleViewINE}
                              onToggleBlacklist={handleToggleBlacklist}
                              onToggleFrequentCustomer={handleToggleFrequentCustomer}
                            />
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

        {/* Modal de Historial de Rentas */}
        {isRentalHistoryModalOpen && selectedCustomer && (
          <div className="modal-overlay" onClick={() => setIsRentalHistoryModalOpen(false)}>
            <div className="modal-content rental-history-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">Historial de Rentas</h2>
                  <p className="modal-subtitle">
                    {selectedCustomer.name} {selectedCustomer.last_name}
                  </p>
                </div>
                <button className="modal-close" onClick={() => setIsRentalHistoryModalOpen(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                {loadingRentals ? (
                  <div className="loading-container">
                    <p>Cargando historial...</p>
                  </div>
                ) : customerRentals.length === 0 ? (
                  <div className="no-data">
                    <p>Este cliente no tiene rentas registradas</p>
                  </div>
                ) : (
                  <div className="rental-history-container">
                    <div className="rental-summary">
                      <div className="summary-item">
                        <FiCalendar className="summary-icon" />
                        <div>
                          <span className="summary-label">Total Rentas</span>
                          <span className="summary-value">{customerRentals.length}</span>
                        </div>
                      </div>
                      <div className="summary-item">
                        <span className="summary-icon">💰</span>
                        <div>
                          <span className="summary-label">Total Gastado</span>
                          <span className="summary-value">
                            ${customerRentals.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rental-cards">
                      {customerRentals.map((rental) => {
                        const statusMap: Record<string, { label: string; class: string }> = {
                          'pending': { label: 'Pendiente', class: 'status-pending' },
                          'on_course': { label: 'En Curso', class: 'status-on_course' },
                          'finished': { label: 'Finalizado', class: 'status-finished' },
                          'canceled': { label: 'Cancelado', class: 'status-canceled' }
                        };
                        const statusInfo = statusMap[rental.status] || { label: rental.status, class: '' };
                        const isReturned = rental.due_date !== null;

                        return (
                          <div key={rental.id} className="rental-card">
                            <div
                              className="rental-card-header clickable"
                              onClick={() => toggleRentalExpand(rental.id)}
                            >
                              <h3 className="rental-product-name">{rental.product_name}</h3>
                              <div className="rental-header-right">
                                <span className={`status-badge ${statusInfo.class}`}>
                                  {statusInfo.label}
                                </span>
                                <span className="expand-icon">
                                  {expandedRentals.has(rental.id) ? '▼' : '▶'}
                                </span>
                              </div>
                            </div>

                            {expandedRentals.has(rental.id) && (<div className="rental-card-body">
                              <div className="rental-info-grid">
                                <div className="rental-info-item">
                                  <FiCalendar className="info-icon" />
                                  <div>
                                    <span className="info-label">Fecha Entrega</span>
                                    <span className="info-value">
                                      {new Date(rental.delivery_date).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>

                                <div className="rental-info-item">
                                  <FiCalendar className="info-icon" />
                                  <div>
                                    <span className="info-label">Devolución</span>
                                    <span className="info-value">
                                      {rental.due_date ? new Date(rental.due_date).toLocaleDateString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      }) : 'Pendiente'}
                                    </span>
                                  </div>
                                </div>

                                <div className={`rental-info-item ${isReturned ? 'returned' : 'pending'}`}>
                                  {isReturned ? <FiStar className="info-icon" /> : <FiMinus className="info-icon" />}
                                  <div>
                                    <span className="info-label">Devuelto</span>
                                    <span className="info-value">
                                      {isReturned && rental.due_date
                                        ? new Date(rental.due_date).toLocaleDateString('es-ES', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })
                                        : 'Pendiente'
                                      }
                                    </span>
                                  </div>
                                </div>

                                <div className="rental-info-item total">
                                  <span className="info-icon">💵</span>
                                  <div>
                                    <span className="info-label">Total</span>
                                    <span className="info-value price">${rental.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
};

export default Clientes;

