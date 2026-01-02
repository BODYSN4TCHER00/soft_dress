import { useState, useEffect } from 'react';
import { FiTrendingUp, FiX, FiUsers, FiArrowRight, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import SharedLayout from '../../Components/shared/SharedLayout';
import AdminHeader from '../../Components/admin/AdminHeader';
import AddDressModal from '../../Components/modals/AddDressModal';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import DateRangeFilter from '../../Components/shared/DateRangeFilter';
import { supabase } from '../../utils/supabase/client';
import '../../styles/AdminDashboard.css';

interface FrequentCustomer {
  id: number;
  name: string;
  last_name: string | null;
  phone: string | null;
  rentalCount: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Año' | 'Mes' | 'Semana' | 'Dia' | 'Otro'>('Mes');
  const [isAddDressModalOpen, setIsAddDressModalOpen] = useState(false);
  const [stats, setStats] = useState({
    activeRentals: 0,
    pendingReturns: 0,
    cancellations: 0,
    bestSellingDress: { name: '', count: 0 },
    totalCustomers: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [frequentCustomers, setFrequentCustomers] = useState<FrequentCustomer[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter, customDateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Ejecutar todas las queries en paralelo
      const [
        activeOrdersResult,
        pendingReturnsResult,
        cancellationsResult,
        ordersResult,
        customersResult,
        allOrdersResult,
        allRentalsResult
      ] = await Promise.all([
        supabase
          .from('Orders')
          .select('id, status')
          .in('status', ['on_course', 'pending']),
        supabase
          .from('Orders')
          .select('id')
          .lte('due_date', today)
          .is('due_date', null)
          .in('status', ['on_course']),
        supabase
          .from('Orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['canceled']),
        supabase
          .from('Orders')
          .select('product_id, Products!inner(name)'),
        supabase
          .from('Customers')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('Orders')
          .select(`
            id,
            created_at,
            Products!product_id (name),
            Customers!customer_id (name, last_name)
          `)
          .order('created_at', { ascending: true }),
        supabase
          .from('Orders')
          .select('customer_id, Customers!customer_id (id, name, last_name, phone)')
      ]);

      const activeOrders = activeOrdersResult.data || [];
      const pendingReturns = pendingReturnsResult.data || [];
      const cancellationsCount = cancellationsResult.count || 0;
      const orders = ordersResult.data || [];
      const customersCount = customersResult.count || 0;
      const allOrders = allOrdersResult.data || [];
      const allRentals = allRentalsResult.data || [];

      // Calcular clientes frecuentes (2 o más rentas)
      const rentalCounts: { [key: number]: { count: number; customer: any } } = {};
      allRentals.forEach((rental: any) => {
        if (rental.customer_id && rental.Customers) {
          if (!rentalCounts[rental.customer_id]) {
            rentalCounts[rental.customer_id] = {
              count: 0,
              customer: rental.Customers
            };
          }
          rentalCounts[rental.customer_id].count++;
        }
      });

      const frequentCustomersList: FrequentCustomer[] = Object.values(rentalCounts)
        .filter(item => item.count >= 2)
        .map(item => ({
          id: item.customer.id,
          name: item.customer.name || '',
          last_name: item.customer.last_name,
          phone: item.customer.phone,
          rentalCount: item.count
        }))
        .sort((a, b) => b.rentalCount - a.rentalCount)
        .slice(0, 5); // Top 5 clientes frecuentes

      setFrequentCustomers(frequentCustomersList);

      // Calcular vestido más vendido de forma eficiente
      let bestSellingDress = { name: '', count: 0 };
      if (orders.length > 0) {
        const dressCounts: { [key: number]: { count: number; name: string } } = {};
        orders.forEach((order: any) => {
          if (order.product_id && order.Products) {
            const product = Array.isArray(order.Products) ? order.Products[0] : order.Products;
            if (!dressCounts[order.product_id]) {
              dressCounts[order.product_id] = { count: 0, name: product?.name || 'Desconocido' };
            }
            dressCounts[order.product_id].count++;
          }
        });

        const bestSelling = Object.values(dressCounts).sort((a, b) => b.count - a.count)[0];
        if (bestSelling) {
          bestSellingDress = { name: bestSelling.name, count: bestSelling.count };
        }
      }

      // Generar datos del gráfico basados en rentas reales
      const chartData = generateChartDataFromOrders(
        allOrders,
        timeFilter,
        customDateRange.start,
        customDateRange.end
      );

      setStats({
        activeRentals: activeOrders.length,
        pendingReturns: pendingReturns.length,
        cancellations: cancellationsCount,
        bestSellingDress: bestSellingDress,
        totalCustomers: customersCount,
      });
      setChartData(chartData);
    } catch (error) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  interface OrderWithDetails {
    id: number;
    created_at: string;
    Products: { name: string } | { name: string }[] | null;
    Customers: { name: string; last_name: string | null } | { name: string; last_name: string | null }[] | null;
  }

  const generateChartDataFromOrders = (
    orders: OrderWithDetails[],
    filter: string,
    customStart?: Date | null,
    customEnd?: Date | null
  ) => {
    if (!orders || orders.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let interval: 'day' | 'hour' | 'month' | 'year';
    let formatLabel: (date: Date) => string;

    if (filter === 'Otro' && customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
      endDate.setHours(23, 59, 59, 999);

      // Determinar intervalo basado en el rango
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        interval = 'hour';
        formatLabel = (date) => `${date.getHours()}:00`;
      } else if (daysDiff <= 31) {
        interval = 'day';
        formatLabel = (date) => `${date.getDate()}/${date.getMonth() + 1}`;
      } else if (daysDiff <= 365) {
        interval = 'month';
        formatLabel = (date) => {
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return monthNames[date.getMonth()];
        };
      } else {
        interval = 'month';
        formatLabel = (date) => {
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        };
      }
    } else {
      switch (filter) {
        case 'Dia':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now);
          interval = 'hour';
          formatLabel = (date) => `${date.getHours()}:00`;
          break;
        case 'Semana':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          endDate = new Date(now);
          interval = 'day';
          formatLabel = (date) => {
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return dayNames[date.getDay()];
          };
          break;
        case 'Mes':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now);
          interval = 'day';
          formatLabel = (date) => `${date.getDate()}/${date.getMonth() + 1}`;
          break;
        case 'Año':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now);
          interval = 'month';
          formatLabel = (date) => {
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return monthNames[date.getMonth()];
          };
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now);
          interval = 'day';
          formatLabel = (date) => `${date.getDate()}/${date.getMonth() + 1}`;
      }
    }

    // Crear buckets de tiempo
    const buckets: { [key: string]: { count: number; orders: OrderWithDetails[] } } = {};

    // Inicializar buckets
    const current = new Date(startDate);
    while (current <= endDate) {
      let key: string;
      if (interval === 'hour') {
        key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}-${current.getHours()}`;
      } else if (interval === 'day') {
        key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      } else if (interval === 'month') {
        key = `${current.getFullYear()}-${current.getMonth()}`;
      } else {
        key = `${current.getFullYear()}`;
      }
      buckets[key] = { count: 0, orders: [] };

      if (interval === 'hour') {
        current.setHours(current.getHours() + 1);
      } else if (interval === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (interval === 'month') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    // Agrupar órdenes por bucket
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      if (orderDate < startDate || orderDate > endDate) return;

      let key: string;
      if (interval === 'hour') {
        key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}-${orderDate.getHours()}`;
      } else if (interval === 'day') {
        key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
      } else if (interval === 'month') {
        key = `${orderDate.getFullYear()}-${orderDate.getMonth()}`;
      } else {
        key = `${orderDate.getFullYear()}`;
      }

      if (buckets[key]) {
        buckets[key].count++;
        buckets[key].orders.push(order);
      }
    });

    // Convertir a array y formatear
    const data = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => {
        const dateParts = key.split('-');
        let date: Date;
        if (interval === 'hour') {
          date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]), parseInt(dateParts[2]), parseInt(dateParts[3]));
        } else if (interval === 'day') {
          date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]), parseInt(dateParts[2]));
        } else if (interval === 'month') {
          date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]));
        } else {
          date = new Date(parseInt(dateParts[0]), 0);
        }

        return {
          name: formatLabel(date),
          value: value.count,
          orders: value.orders, // Guardar órdenes para el tooltip
        };
      });

    return data;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddToCatalog = () => {
    setIsAddDressModalOpen(true);
  };

  const handleDressAdded = () => {
    setIsAddDressModalOpen(false);
    loadDashboardData(); // Recargar datos del dashboard
  };

  return (
    <SharedLayout>
      <div className="admin-dashboard-container">
        <AdminHeader
          onSearch={handleSearch}
          searchValue={searchQuery}
        />

        <main className="dashboard-main">
          {loading ? (
            <LoadingSpinner message="Cargando dashboard..." />
          ) : (
            <>
              <div className="dashboard-title-section">
                <h1 className="dashboard-title">Dashboard Administrador</h1>
              </div>

              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">
                    <FiTrendingUp />
                  </div>
                  <div className="card-content">
                    <div className="card-title">Actividad</div>
                    <div className="card-items">
                      <div className="card-item">
                        <span className="dot green"></span>
                        <span>{stats.activeRentals} Rentas activas</span>
                      </div>
                      <div className="card-item">
                        <span className="dot yellow"></span>
                        <span>{stats.pendingReturns} Devolucion Pendiente</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon red">
                    <FiX />
                  </div>
                  <div className="card-content">
                    <div className="card-title">Cancelaciones</div>
                    <div className="card-value">
                      <span className="dot red"></span>
                      {stats.cancellations} Cancelacion
                    </div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon dress">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3L8 7H6C5.4 7 5 7.4 5 8V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V8C19 7.4 18.6 7 18 7H16L12 3Z" />
                    </svg>
                  </div>
                  <div className="card-content">
                    <div className="card-title">Vestido mas vendido</div>
                    <div className="card-value-large">{stats.bestSellingDress.count} veces</div>
                    <div className="card-subtitle">{stats.bestSellingDress.name || 'N/A'}</div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">
                    <FiUsers />
                  </div>
                  <div className="card-content">
                    <div className="card-title">Clientes</div>
                    <div className="card-value-large">{stats.totalCustomers}</div>
                    <div className="card-subtitle">Clientes</div>
                  </div>
                </div>
              </div>

              <div className="dashboard-content-grid">
                <div className="chart-section">
                  <div className="chart-header">
                    <h2 className="chart-title">Resumen de Rentas:</h2>
                    <div className="chart-controls">
                      <div className="time-filters">
                        {['Año', 'Mes', 'Semana', 'Dia', 'Otro'].map((filter) => (
                          <button
                            key={filter}
                            className={`time-filter ${timeFilter === filter ? 'active' : ''}`}
                            onClick={() => {
                              setTimeFilter(filter as any);
                              if (filter !== 'Otro') {
                                setCustomDateRange({ start: null, end: null });
                              }
                            }}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                      {timeFilter === 'Otro' && (
                        <div className="custom-date-filter">
                          <DateRangeFilter
                            onDateChange={(start, end) => setCustomDateRange({ start, end })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const orders = data.orders || [];
                              return (
                                <div className="custom-tooltip">
                                  <p className="tooltip-label">{`${data.name}: ${data.value} renta(s)`}</p>
                                  {orders.length > 0 && (
                                    <div className="tooltip-orders">
                                      {orders.slice(0, 5).map((order: any) => {
                                        const customer = Array.isArray(order.Customers) ? order.Customers[0] : order.Customers;
                                        const product = Array.isArray(order.Products) ? order.Products[0] : order.Products;
                                        return (
                                          <div key={order.id} className="tooltip-order">
                                            <span className="tooltip-client">
                                              {customer
                                                ? `${customer.name}${customer.last_name ? ` ${customer.last_name}` : ''}`
                                                : 'Cliente desconocido'}
                                            </span>
                                            <span className="tooltip-dress">
                                              - {product?.name || 'Vestido desconocido'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                      {orders.length > 5 && (
                                        <div className="tooltip-more">... y {orders.length - 5} más</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="linear"
                          dataKey="value"
                          stroke="#7C107C"
                          strokeWidth={2}
                          dot={{ fill: '#7C107C', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="sidebar-cards">
                  <div className="sidebar-card frequent-customers-card">
                    <div className="sidebar-card-header">
                      <div className="sidebar-card-icon">
                        <FiUsers />
                      </div>
                      <div className="sidebar-card-title">Clientes Frecuentes</div>
                    </div>
                    <div className="frequent-customers-list">
                      {frequentCustomers.length > 0 ? (
                        <>
                          {frequentCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="frequent-customer-item"
                              onClick={() => navigate('/admin/clientes', { state: { highlightCustomerId: customer.id } })}
                            >
                              <div className="customer-info">
                                <div className="customer-name">
                                  <FiStar className="star-icon" />
                                  {customer.name} {customer.last_name || ''}
                                </div>
                                {customer.phone && (
                                  <div className="customer-phone">{customer.phone}</div>
                                )}
                              </div>
                              <div className="customer-rentals">
                                <span className="rental-count">{customer.rentalCount}</span>
                                <span className="rental-label">rentas</span>
                              </div>
                            </div>
                          ))}
                          <button
                            className="view-all-customers-btn"
                            onClick={() => navigate('/admin/clientes', { state: { filter: 'Clientes Frecuentes' } })}
                          >
                            Ver todos los clientes frecuentes
                            <FiArrowRight />
                          </button>
                        </>
                      ) : (
                        <div className="no-frequent-customers">
                          <p>No hay clientes frecuentes aún</p>
                          <span>Los clientes con 2 o más rentas aparecerán aquí</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="add-catalog-button" onClick={handleAddToCatalog}>
                    <div className="button-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3L8 7H6C5.4 7 5 7.4 5 8V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V8C19 7.4 18.6 7 18 7H16L12 3Z" />
                      </svg>
                    </div>
                    <span>Agregar al Catalogo</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <AddDressModal
          isOpen={isAddDressModalOpen}
          onClose={() => setIsAddDressModalOpen(false)}
          onDressAdded={handleDressAdded}
        />
      </div>
    </SharedLayout>
  );
};

export default AdminDashboard;


