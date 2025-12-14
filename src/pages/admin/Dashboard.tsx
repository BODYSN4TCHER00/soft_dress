import { useState, useEffect } from 'react';
import { FiTrendingUp, FiX, FiUsers } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import SharedLayout from '../../Components/shared/SharedLayout';
import AdminHeader from '../../Components/admin/AdminHeader';
import AddDressModal from '../../Components/modals/AddDressModal';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import DateRangeFilter from '../../Components/shared/DateRangeFilter';
import { useAuth } from '../../utils/context/AuthContext';
import { supabase } from '../../utils/supabase/client';
import '../../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    loadDashboardData();
  }, [timeFilter, customDateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Cargar rentas activas
      const { data: activeOrders } = await supabase
        .from('Orders')
        .select('*')
        .in('status', ['active', 'pending']);

      // Cargar devoluciones pendientes
      const today = new Date().toISOString().split('T')[0];
      const { data: pendingReturns } = await supabase
        .from('Orders')
        .select('*')
        .lte('due_date', today)
        .is('return_date', null)
        .in('status', ['active']);

      // Cargar cancelaciones
      const { count: cancellationsCount } = await supabase
        .from('Orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['cancelled', 'canceled']);

      // Cargar vestido más vendido
      const { data: orders } = await supabase
        .from('Orders')
        .select('product_id, Products(name)');

      let bestSellingDress = { name: '', count: 0 };
      if (orders) {
        const dressCounts: { [key: number]: number } = {};
        orders.forEach(order => {
          if (order.product_id) {
            dressCounts[order.product_id] = (dressCounts[order.product_id] || 0) + 1;
          }
        });

        const bestSelling = Object.entries(dressCounts).sort((a, b) => b[1] - a[1])[0];
        if (bestSelling) {
          const { data: product } = await supabase
            .from('Products')
            .select('name')
            .eq('id', parseInt(bestSelling[0]))
            .single();

          if (product) {
            bestSellingDress = { name: product.name, count: bestSelling[1] };
          }
        }
      }

      // Cargar total de clientes
      const { count: customersCount } = await supabase
        .from('Customers')
        .select('*', { count: 'exact', head: true });

      // Cargar rentas con detalles para la gráfica
      const { data: allOrders } = await supabase
        .from('Orders')
        .select(`
          *,
          Products:product_id (name),
          Customers:customer_id (name, last_name)
        `)
        .order('created_at', { ascending: true });

      // Generar datos del gráfico basados en rentas reales
      const chartData = generateChartDataFromOrders(
        allOrders || [], 
        timeFilter,
        customDateRange.start,
        customDateRange.end
      );

      setStats({
        activeRentals: activeOrders?.length || 0,
        pendingReturns: pendingReturns?.length || 0,
        cancellations: cancellationsCount || 0,
        bestSellingDress: bestSellingDress,
        totalCustomers: customersCount || 0,
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
    Products: { name: string } | null;
    Customers: { name: string; last_name: string | null } | null;
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

  const handleGenerateReport = () => {
    toast.success('Generando reporte...');
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
          onGenerateReport={handleGenerateReport}
          searchValue={searchQuery}
        />

        <main className="dashboard-main">
          {loading ? (
            <LoadingSpinner message="Cargando dashboard..." />
          ) : (
            <>
              <div className="dashboard-title-section">
                <h1 className="dashboard-title">Dashboard Administrador</h1>
                <span className="dashboard-welcome">Bienvenido, {user?.name}</span>
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
                                  {orders.slice(0, 5).map((order: OrderWithDetails) => (
                                    <div key={order.id} className="tooltip-order">
                                      <span className="tooltip-client">
                                        {order.Customers 
                                          ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
                                          : 'Cliente desconocido'}
                                      </span>
                                      <span className="tooltip-dress">
                                        - {order.Products?.name || 'Vestido desconocido'}
                                      </span>
                                    </div>
                                  ))}
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
                      type="monotone" 
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
              <div className="sidebar-card">
                <div className="sidebar-card-icon">
                  <FiUsers />
                </div>
                <div className="sidebar-card-title">Clientes Frecuentes</div>
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


