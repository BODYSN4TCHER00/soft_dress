import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import StaffLayout from '../../Components/staff/StaffLayout';
import StaffHeader from '../../Components/staff/StaffHeader';
import RentalFilters from '../../Components/staff/RentalFilters';
import RentalTable from '../../Components/staff/RentalTable';
import FloatingActionButton from '../../Components/staff/FloatingActionButton';
import DeliveryCard from '../../Components/staff/DeliveryCard';
import RentDressModal from '../../Components/modals/RentDressModal';
import RentalDetailModal from '../../Components/modals/RentalDetailModal';
import EditRentalModal from '../../Components/modals/EditRentalModal';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import DateSortControl, { type SortOption } from '../../Components/shared/DateSortControl';
import { supabase } from '../../utils/supabase/client';
import '../../styles/Rentas.css';
import '../../styles/RentasActivities.css';

const SORT_OPTIONS: SortOption[] = [
  { value: 'fecha-desc', label: 'Más reciente primero', field: 'fechaRenta', direction: 'desc' },
  { value: 'fecha-asc', label: 'Más antigua primero', field: 'fechaRenta', direction: 'asc' },
  { value: 'entrega-asc', label: 'Entrega: próximas primero', field: 'entrega', direction: 'asc' },
  { value: 'entrega-desc', label: 'Entrega: lejanas primero', field: 'entrega', direction: 'desc' },
  { value: 'devolucion-asc', label: 'Devolución: próximas primero', field: 'devolucion', direction: 'asc' },
  { value: 'devolucion-desc', label: 'Devolución: lejanas primero', field: 'devolucion', direction: 'desc' },
];

export interface Rental {
  id: string;
  cliente: string;
  vestido: string;
  fechaRenta: string;
  entrega: string;
  devolucion: string;
  telefono: string;
  segundoTelefono?: string;
  estado: 'Pendiente' | 'En Curso' | 'Finalizado' | 'Cancelado';
}

interface DeliveryItem {
  id: number;
  dress: string;
  client: string;
  date: string;
}

const Rentas = () => {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [selectedRentals, setSelectedRentals] = useState<Set<string>>(new Set());
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rentalToEdit, setRentalToEdit] = useState<Rental | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<DeliveryItem[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<DeliveryItem[]>([]);

  useEffect(() => {
    loadRentals();
    loadUpcomingActivities();
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
          due_date,
          status,
          Products!product_id (name),
          Customers!customer_id (name, last_name, phone, second_phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error al cargar las rentas');
        return;
      }

      if (orders) {
        const mappedRentals: Rental[] = orders.map((order: any) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';

          const dressName = order.Products?.name || 'Vestido desconocido';
          const phone = order.Customers?.phone || 'N/A';
          const segundoTelefono = order.Customers?.second_phone || undefined;

          // Mapear estados de BD a estados de la UI
          let estado: Rental['estado'] = 'Pendiente';
          if (order.status === 'on_course') {
            estado = 'En Curso';
          } else if (order.status === 'finished') {
            estado = 'Finalizado';
          } else if (order.status === 'canceled') {
            estado = 'Cancelado';
          } else if (order.status === 'pending') {
            estado = 'Pendiente';
          }

          // Formatear fecha de renta (created_at)
          const fechaRenta = new Date(order.created_at).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          // Formatear fechas de entrega y devolución
          const entrega = new Date(order.delivery_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          const devolucion = new Date(order.due_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return {
            id: order.id.toString(),
            cliente: customerName,
            vestido: dressName,
            fechaRenta,
            entrega,
            devolucion,
            telefono: phone,
            segundoTelefono,
            estado,
          };
        });

        setRentals(mappedRentals);
        setLoading(false);
      }
    } catch (error) {
      toast.error('Error inesperado');
      setLoading(false);
    }
  };

  const loadUpcomingActivities = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Próximas entregas
      const { data: deliveries } = await supabase
        .from('Orders')
        .select(`
          delivery_date,
          Products!product_id(name),
          Customers!customer_id(name,last_name,phone)
        `)
        .gte('delivery_date', todayStr)
        .in('status', ['on_course', 'pending'])
        .order('delivery_date', { ascending: true })
        .limit(5);

      if (deliveries) {
        const mappedDeliveries: DeliveryItem[] = deliveries.map((order: any) => {
          const clientName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente';
          const dressName = order.Products?.name || 'Vestido';
          const deliveryDate = new Date(order.delivery_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          });

          return {
            id: order.id || 0,
            dress: dressName,
            client: clientName,
            date: deliveryDate,
          };
        });
        setUpcomingDeliveries(mappedDeliveries);
      }

      // Próximas devoluciones
      const { data: returns } = await supabase
        .from('Orders')
        .select(`
          due_date,
          Products!product_id(name),
          Customers!customer_id(name,last_name,phone)
        `)
        .gte('due_date', todayStr)
        .in('status', ['on_course', 'pending'])
        .order('due_date', { ascending: true })
        .limit(5);

      if (returns) {
        const mappedReturns: DeliveryItem[] = returns.map((order: any) => {
          const clientName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente';
          const dressName = order.Products?.name || 'Vestido';
          const returnDate = new Date(order.due_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          });

          return {
            id: order.id || 0,
            dress: dressName,
            client: clientName,
            date: returnDate,
          };
        });
        setUpcomingReturns(mappedReturns);
      }
    } catch (error) {
    }
  };



  const handleAddRental = () => {
    setIsRentModalOpen(true);
  };

  const handleRentalCreated = () => {
    loadRentals();
    toast.success('Renta creada exitosamente');
  };

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredRentals = rentals.filter(r => {
    const matchesStatus = activeFilter === 'Todos' || r.estado === activeFilter;

    // Filtro por fecha de renta
    let matchesDate = true;
    if (dateFilter.start || dateFilter.end) {
      matchesDate = false;
      const fechaRentaDate = parseDate(r.fechaRenta);

      if (dateFilter.start && dateFilter.end) {
        // Rango de fechas
        matchesDate = fechaRentaDate >= dateFilter.start && fechaRentaDate <= dateFilter.end;
      } else if (dateFilter.start) {
        // Solo fecha inicio
        matchesDate = fechaRentaDate >= dateFilter.start;
      } else if (dateFilter.end) {
        // Solo fecha fin
        matchesDate = fechaRentaDate <= dateFilter.end;
      }
    }

    return matchesStatus && matchesDate;
  });

  // Aplicar ordenamiento
  const sortedRentals = useMemo(() => {
    return [...filteredRentals].sort((a, b) => {
      const field = sortOption.field as keyof Pick<Rental, 'fechaRenta' | 'entrega' | 'devolucion'>;
      const dateA = parseDate(a[field]);
      const dateB = parseDate(b[field]);
      return sortOption.direction === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
  }, [filteredRentals, sortOption]);

  const handleView = (rental: Rental) => {
    setSelectedRental(rental);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (rental: Rental) => {
    setRentalToEdit(rental);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta renta? (Baja lógica)')) {
      try {
        const { error } = await supabase
          .from('Orders')
          .update({ status: 'cancelled' })
          .eq('id', parseInt(id));

        if (error) {
          toast.error('Error al eliminar la renta');
          return;
        }

        toast.success('Renta eliminada (baja lógica aplicada)');
        loadRentals();
      } catch (error) {
        toast.error('Error al eliminar la renta');
      }
    }
  };

  const handleSaveEdit = async (updatedRental: Rental) => {
    try {
      // Mapear estado de UI a estado de BD
      let status = 'pending';
      if (updatedRental.estado === 'En Curso') {
        status = 'on_course';
      } else if (updatedRental.estado === 'Finalizado') {
        status = 'finished';
      } else if (updatedRental.estado === 'Cancelado') {
        status = 'canceled';
      } else if (updatedRental.estado === 'Pendiente') {
        status = 'pending';
      }

      // Parsear fechas
      const deliveryDate = parseDateString(updatedRental.entrega);
      const dueDate = parseDateString(updatedRental.devolucion);

      const { error } = await supabase
        .from('Orders')
        .update({
          delivery_date: deliveryDate,
          due_date: dueDate,
          status: status,
        })
        .eq('id', parseInt(updatedRental.id));

      if (error) {
        toast.error('Error al actualizar la renta');
        return;
      }

      toast.success('Renta actualizada exitosamente');
      setIsEditModalOpen(false);
      setRentalToEdit(null);
      loadRentals();
    } catch (error) {
      toast.error('Error al actualizar la renta');
    }
  };

  const parseDateString = (dateString: string): string => {
    const [day, month, year] = dateString.split('/').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const handleBulkStatusChange = async (newStatus: Rental['estado']) => {
    if (selectedRentals.size === 0) {
      toast.error('Selecciona al menos una renta');
      return;
    }

    try {
      // Mapear estado de UI a estado de BD
      let status = 'pending';
      if (newStatus === 'En Curso') {
        status = 'on_course';
      } else if (newStatus === 'Finalizado') {
        status = 'finished';
      } else if (newStatus === 'Cancelado') {
        status = 'canceled';
      } else if (newStatus === 'Pendiente') {
        status = 'pending';
      }

      const ids = Array.from(selectedRentals).map(id => parseInt(id));
      const { error } = await supabase
        .from('Orders')
        .update({ status })
        .in('id', ids);

      if (error) {
        toast.error('Error al actualizar las rentas');
        return;
      }

      const count = selectedRentals.size;
      setSelectedRentals(new Set());
      setIsSelectionMode(false);
      toast.success(`${count} renta(s) actualizada(s)`);
      loadRentals();
    } catch (error) {
      toast.error('Error al actualizar las rentas');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Rental['estado']) => {
    try {
      // Mapear estado de UI a estado de BD
      let status = 'pending';
      if (newStatus === 'En Curso') {
        status = 'on_course';
      } else if (newStatus === 'Finalizado') {
        status = 'finished';
      } else if (newStatus === 'Cancelado') {
        status = 'canceled';
      } else if (newStatus === 'Pendiente') {
        status = 'pending';
      }

      const { error } = await supabase
        .from('Orders')
        .update({ status })
        .eq('id', parseInt(id));

      if (error) {
        toast.error('Error al actualizar el estado');
        return;
      }

      toast.success('Estado actualizado');
      loadRentals();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };


  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRentals(new Set(filteredRentals.map(r => r.id)));
    } else {
      setSelectedRentals(new Set());
    }
  };

  const handleSelectRental = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRentals);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRentals(newSelected);
  };

  return (
    <StaffLayout>
      <div className="rentas-page">
        <StaffHeader />

        {/* Sección de próximas actividades */}
        <div className="upcoming-section">
          <div className="upcoming-grid">
            <DeliveryCard
              title="Próximas Entregas"
              borderColor="#7C107C"
              badgeCount={upcomingDeliveries.length}
              empty={upcomingDeliveries.length === 0}
              emptyMessage="No hay entregas próximas"
              items={upcomingDeliveries}
            />

            <DeliveryCard
              title="Próximas Devoluciones"
              borderColor="#BE56BD"
              badgeCount={upcomingReturns.length}
              empty={upcomingReturns.length === 0}
              emptyMessage="No hay devoluciones próximas"
              items={upcomingReturns}
            />
          </div>
        </div>

        {/* Sección principal de rentas */}
        <div className="rentas-section">
          <RentalFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onDateFilterChange={(start, end) => setDateFilter({ start, end })}
          />

          <div className="table-controls">
            <DateSortControl
              options={SORT_OPTIONS}
              value={sortOption}
              onChange={setSortOption}
            />
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <RentalTable
              rentals={sortedRentals}
              selectedRentals={selectedRentals}
              onSelectAll={handleSelectAll}
              onSelectRental={handleSelectRental}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              isSelectionMode={isSelectionMode}
            />
          )}
        </div>

        {isSelectionMode && selectedRentals.size > 0 && (
          <div className="bulk-actions">
            <div className="bulk-actions-info">
              <span>{selectedRentals.size} renta(s) seleccionada(s)</span>
            </div>
            <div className="bulk-actions-buttons">
              <button
                className="bulk-btn"
                onClick={() => handleBulkStatusChange('En Curso')}
              >
                Marcar En Curso
              </button>
              <button
                className="bulk-btn"
                onClick={() => handleBulkStatusChange('Finalizado')}
              >
                Finalizar
              </button>
              <button
                className="bulk-btn cancel"
                onClick={() => {
                  setSelectedRentals(new Set());
                  setIsSelectionMode(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="table-controls">
          <label className="selection-mode-toggle">
            <input
              type="checkbox"
              checked={isSelectionMode}
              onChange={(e) => {
                setIsSelectionMode(e.target.checked);
                if (!e.target.checked) {
                  setSelectedRentals(new Set());
                }
              }}
              className="selection-checkbox"
            />
            <span>Activar Selección</span>
          </label>
        </div>

        <FloatingActionButton onClick={handleAddRental} />

        <RentDressModal
          isOpen={isRentModalOpen}
          onClose={() => setIsRentModalOpen(false)}
          onRentalCreated={handleRentalCreated}
        />

        <RentalDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRental(null);
          }}
          rental={selectedRental}
        />

        <EditRentalModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setRentalToEdit(null);
          }}
          rental={rentalToEdit}
          onSave={handleSaveEdit}
        />
      </div>
    </StaffLayout>
  );
};

export default Rentas;
