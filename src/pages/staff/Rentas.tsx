import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import StaffLayout from '../../Components/staff/StaffLayout';
import StaffHeader from '../../Components/staff/StaffHeader';
import RentalFilters from '../../Components/staff/RentalFilters';
import RentalTable from '../../Components/staff/RentalTable';
import FloatingActionButton from '../../Components/staff/FloatingActionButton';
import RentDressModal from '../../Components/modals/RentDressModal';
import RentalDetailModal from '../../Components/modals/RentalDetailModal';
import EditRentalModal from '../../Components/modals/EditRentalModal';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import { supabase } from '../../utils/supabase/client';
import '../../styles/Rentas.css';

export interface Rental {
  id: string;
  cliente: string;
  vestido: string;
  fechaRenta: string;
  entrega: string;
  devolucion: string;
  telefono: string;
  segundoTelefono?: string;
  estado: 'Completado' | 'Cancelado' | 'Activo';
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
  contract_url: string | null;
  status: string;
  advance_payment: number;
  penalty_fee: number;
  created_at: string;
  Products: { name: string } | null;
  Customers: { name: string; last_name: string | null; phone: string | null; second_phone: string | null } | null;
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

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('Orders')
        .select(`
          *,
          Products:product_id (name),
          Customers:customer_id (name, last_name, phone, second_phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('Error al cargar las rentas');
        return;
      }

      if (orders) {
        const mappedRentals: Rental[] = orders.map((order: OrderFromDB) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';
          
          const dressName = order.Products?.name || 'Vestido desconocido';
          const phone = order.Customers?.phone || 'N/A';
          const segundoTelefono = order.Customers?.second_phone || undefined;

          // Mapear estados de BD a estados de la UI
          let estado: 'Completado' | 'Cancelado' | 'Activo' = 'Activo';
          if (order.status === 'completed') {
            estado = 'Completado';
          } else if (order.status === 'cancelled' || order.status === 'canceled') {
            estado = 'Cancelado';
          } else {
            estado = 'Activo';
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
      }
    } catch (error) {
      console.error('Error loading rentals:', error);
      toast.error('Error al cargar las rentas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query) {
      toast.success(`Buscando: ${query}`);
    }
  };

  const handleGenerateReport = () => {
    toast.success('Generando reporte...');
  };

  const handleAddRental = () => {
    setIsRentModalOpen(true);
  };

  const handleRentalCreated = () => {
    loadRentals();
    toast.success('Renta creada exitosamente');
  };

  const filteredRentals = rentals.filter(r => {
    // Filtro por estado
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

  const parseDate = (dateString: string): Date => {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

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
          console.error('Error deleting order:', error);
          toast.error('Error al eliminar la renta');
          return;
        }

        toast.success('Renta eliminada (baja lógica aplicada)');
        loadRentals();
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Error al eliminar la renta');
      }
    }
  };

  const handleSaveEdit = async (updatedRental: Rental) => {
    try {
      // Mapear estado de UI a estado de BD
      let status = 'active';
      if (updatedRental.estado === 'Completado') {
        status = 'completed';
      } else if (updatedRental.estado === 'Cancelado') {
        status = 'cancelled';
      } else {
        status = 'active';
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
        console.error('Error updating order:', error);
        toast.error('Error al actualizar la renta');
        return;
      }

      toast.success('Renta actualizada exitosamente');
      setIsEditModalOpen(false);
      setRentalToEdit(null);
      loadRentals();
    } catch (error) {
      console.error('Error updating order:', error);
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
      let status = 'active';
      if (newStatus === 'Completado') {
        status = 'completed';
      } else if (newStatus === 'Cancelado') {
        status = 'cancelled';
      } else {
        status = 'active';
      }

      const ids = Array.from(selectedRentals).map(id => parseInt(id));
      const { error } = await supabase
        .from('Orders')
        .update({ status })
        .in('id', ids);

      if (error) {
        console.error('Error updating orders:', error);
        toast.error('Error al actualizar las rentas');
        return;
      }

      const count = selectedRentals.size;
      setSelectedRentals(new Set());
      setIsSelectionMode(false);
      toast.success(`${count} renta(s) actualizada(s)`);
      loadRentals();
    } catch (error) {
      console.error('Error updating orders:', error);
      toast.error('Error al actualizar las rentas');
    }
  };

  const handleStatusChange = async (id: string, newStatus: Rental['estado']) => {
    try {
      // Mapear estado de UI a estado de BD
      let status = 'active';
      if (newStatus === 'Completado') {
        status = 'completed';
      } else if (newStatus === 'Cancelado') {
        status = 'cancelled';
      } else {
        status = 'active';
      }

      const { error } = await supabase
        .from('Orders')
        .update({ status })
        .eq('id', parseInt(id));

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Error al actualizar el estado');
        return;
      }

      toast.success('Estado actualizado');
      loadRentals();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleDateFilterChange = (start: Date | null, end: Date | null) => {
    setDateFilter({ start, end });
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
      <StaffHeader onSearch={handleSearch} onGenerateReport={handleGenerateReport} />
      <main className="rentas-content">
        <h1 className="rentas-title">Historial de Rentas</h1>

        <RentalFilters 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          onDateFilterChange={handleDateFilterChange}
        />

        {isSelectionMode && selectedRentals.size > 0 && (
          <div className="bulk-actions">
            <div className="bulk-actions-info">
              <span>{selectedRentals.size} renta(s) seleccionada(s)</span>
            </div>
            <div className="bulk-actions-buttons">
              <button 
                className="bulk-btn status-btn active"
                onClick={() => handleBulkStatusChange('Activo')}
              >
                Marcar como Activo
              </button>
              <button 
                className="bulk-btn status-btn completed"
                onClick={() => handleBulkStatusChange('Completado')}
              >
                Marcar como Completado
              </button>
              <button 
                className="bulk-btn status-btn cancelled"
                onClick={() => handleBulkStatusChange('Cancelado')}
              >
                Marcar como Cancelado
              </button>
              <button 
                className="bulk-btn cancel-btn"
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

        {loading ? (
          <LoadingSpinner message="Cargando rentas..." />
        ) : (
          <RentalTable
            rentals={filteredRentals}
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
      </main>
    </StaffLayout>
  );
};

export default Rentas;

