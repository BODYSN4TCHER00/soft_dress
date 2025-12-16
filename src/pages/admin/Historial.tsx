import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { FiTrendingUp, FiX, FiCalendar, FiDollarSign } from 'react-icons/fi';
import SharedLayout from '../../Components/shared/SharedLayout';
import AdminHeader from '../../Components/admin/AdminHeader';
import SummaryCard from '../../Components/shared/SummaryCard';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import { supabase } from '../../utils/supabase/client';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/Historial.css';

interface RentalHistory {
  id: number;
  cliente: string;
  vestido: string;
  fechaCreacion: string;
  fechaEntrega: string;
  fechaDevolucion: string;
  fechaRetorno: string | null;
  precio: number;
  quienRento: string;
  estatus: string;
  notas: string | null;
}

interface OrderFromDB {
  id: number;
  product_id: number | null;
  customer_id: number | null;
  staff_id: string | null;
  delivery_date: string;
  due_date: string;
  return_date: string | null;
  notes: string | null;
  status: string;
  advance_payment: number;
  total_price?: number;
  created_at: string;
  Products: { name: string } | null;
  Customers: { name: string; last_name: string | null } | null;
  Profiles: { name: string; last_name: string | null } | null;
}

const Historial = () => {
  const [rentals, setRentals] = useState<RentalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('Orders')
        .select(`
          id,
          created_at,
          delivery_date,
          due_date,
          return_date,
          status,
          notes,
          Products:product_id (name),
          Customers:customer_id (name, last_name),
          Profiles:staff_id (name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('Error al cargar el historial');
        return;
      }

      if (orders) {
        const mappedRentals: RentalHistory[] = orders.map((order: OrderFromDB) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';
          
          const dressName = order.Products?.name || 'Vestido desconocido';
          
          const staffName = order.Profiles
            ? `${order.Profiles.name || ''}${order.Profiles.last_name ? ` ${order.Profiles.last_name}` : ''}`.trim() || 'N/A'
            : 'N/A';

          // Mapear estados
          let estatus = 'Activo';
          if (order.status === 'completed') {
            estatus = 'Completado';
          } else if (order.status === 'cancelled' || order.status === 'canceled') {
            estatus = 'Cancelado';
          }

          // Formatear fechas
          const fechaCreacion = new Date(order.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const fechaEntrega = new Date(order.delivery_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const fechaDevolucion = new Date(order.due_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const fechaRetorno = order.return_date
            ? new Date(order.return_date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
            : null;

          // Precio: usar total_price si existe, sino advance_payment
          const precio = order.total_price || order.advance_payment || 0;

          return {
            id: order.id,
            cliente: customerName,
            vestido: dressName,
            fechaCreacion,
            fechaEntrega,
            fechaDevolucion,
            fechaRetorno,
            precio,
            quienRento: staffName,
            estatus,
            notas: order.notes,
          };
        });

        setRentals(mappedRentals);
      }
    } catch (error) {
      console.error('Error loading rentals:', error);
      toast.error('Error al cargar el historial');
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

  const filteredRentals = rentals.filter(r => {
    // Filtro por búsqueda
    const matchesSearch = 
      r.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vestido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.quienRento.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro por estado
    const matchesStatus = activeFilter === 'Todos' || r.estatus === activeFilter;
    
    // Filtro por fecha de creación
    let matchesDate = true;
    if (dateFilter.start || dateFilter.end) {
      matchesDate = false;
      const fechaCreacionDate = parseDate(r.fechaCreacion);
      
      if (dateFilter.start && dateFilter.end) {
        matchesDate = fechaCreacionDate >= dateFilter.start && fechaCreacionDate <= dateFilter.end;
      } else if (dateFilter.start) {
        matchesDate = fechaCreacionDate >= dateFilter.start;
      } else if (dateFilter.end) {
        matchesDate = fechaCreacionDate <= dateFilter.end;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };


  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Activo':
        return 'status-active';
      case 'Completado':
        return 'status-completed';
      case 'Cancelado':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const filters = ['Todos', 'Activo', 'Completado', 'Cancelado'];
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    setDateFilter({ ...dateFilter, start: date });
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    setDateFilter({ ...dateFilter, end: date });
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setDateFilter({ start: null, end: null });
  };

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalRentals = rentals.length;
    const cancelledRentals = rentals.filter(r => r.estatus === 'Cancelado').length;
    const totalRevenue = rentals.reduce((sum, r) => sum + r.precio, 0);
    
    // Encontrar día con más rentas
    const dateCounts: { [key: string]: number } = {};
    rentals.forEach(rental => {
      const date = rental.fechaCreacion;
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    const mostRentalsDay = Object.entries(dateCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    const dayWithMostRentals = mostRentalsDay 
      ? `${mostRentalsDay[0]} (${mostRentalsDay[1]} rentas)`
      : 'N/A';

    return {
      totalRentals,
      cancelledRentals,
      totalRevenue,
      dayWithMostRentals,
    };
  }, [rentals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <SharedLayout>
      <div className="historial-container">
        <AdminHeader 
          onSearch={handleSearch}
          onGenerateReport={handleGenerateReport}
          searchValue={searchQuery}
        />

        <main className="historial-main">
          <h1 className="historial-title">Historial de Rentas</h1>

          <div className="summary-cards">
            <SummaryCard
              title="Total de Rentas"
              value={stats.totalRentals}
              icon={<FiTrendingUp />}
              variant="default"
            />
            <SummaryCard
              title="Rentas Canceladas"
              value={stats.cancelledRentals}
              icon={<FiX />}
              variant="danger"
            />
            <SummaryCard
              title="Día con Más Rentas"
              value={stats.dayWithMostRentals}
              icon={<FiCalendar />}
              variant="default"
            />
            <SummaryCard
              title="Ingresos Totales"
              value={formatCurrency(stats.totalRevenue)}
              icon={<FiDollarSign />}
              variant="success"
            />
          </div>

          <div className="historial-filters-container">
            <div className="historial-filters">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="date-filters">
              <div className="date-filter-item">
                <FiCalendar className="date-icon" />
                <DatePicker
                  selected={startDate || undefined}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate || undefined}
                  endDate={endDate || undefined}
                  placeholderText="Fecha inicio"
                  dateFormat="dd/MM/yyyy"
                  className="date-picker-input"
                  calendarClassName="custom-calendar"
                />
              </div>
              <span className="date-separator">-</span>
              <div className="date-filter-item">
                <FiCalendar className="date-icon" />
                <DatePicker
                  selected={endDate || undefined}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate || undefined}
                  endDate={endDate || undefined}
                  minDate={startDate || undefined}
                  placeholderText="Fecha fin"
                  dateFormat="dd/MM/yyyy"
                  className="date-picker-input"
                  calendarClassName="custom-calendar"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  className="clear-date-filter"
                  onClick={clearDateFilter}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Cargando historial..." />
          ) : (
            <div className="table-container">
              <table className="historial-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vestido</th>
                    <th>Fecha Creación</th>
                    <th>Entrega</th>
                    <th>Devolución</th>
                    <th>Retorno</th>
                    <th>Precio</th>
                    <th>Quien Rentó</th>
                    <th>Estatus</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRentals.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="no-data">
                        No hay rentas para mostrar
                      </td>
                    </tr>
                  ) : (
                    filteredRentals.map((rental) => (
                      <tr key={rental.id}>
                        <td>{rental.cliente}</td>
                        <td>{rental.vestido}</td>
                        <td>{rental.fechaCreacion}</td>
                        <td>{rental.fechaEntrega}</td>
                        <td>{rental.fechaDevolucion}</td>
                        <td>{rental.fechaRetorno || 'Pendiente'}</td>
                        <td>{formatCurrency(rental.precio)}</td>
                        <td>{rental.quienRento}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(rental.estatus)}`}>
                            {rental.estatus}
                          </span>
                        </td>
                        <td>
                          {rental.estatus === 'Cancelado' && rental.notas ? (
                            <div className="notes-cell" title={rental.notas}>
                              {rental.notas.length > 50 
                                ? `${rental.notas.substring(0, 50)}...` 
                                : rental.notas}
                            </div>
                          ) : (
                            <span className="no-notes">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </SharedLayout>
  );
};

export default Historial;

