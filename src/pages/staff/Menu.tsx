import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import StaffLayout from '../../Components/staff/StaffLayout';
import StaffHeader from '../../Components/staff/StaffHeader';
import DeliveryCard from '../../Components/staff/DeliveryCard';
import StaffCalendar from '../../Components/staff/StaffCalendar';
import RentDressModal from '../../Components/modals/RentDressModal';
import DayDetailsModal from '../../Components/modals/DayDetailsModal';
import ReserveDressButton from '../../Components/staff/ReserveDressButton';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import LoginAlerts from '../../Components/alerts/LoginAlerts';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../utils/context/AuthContext';
import '../../styles/StaffMenu.css';

interface DeliveryItem {
  id: number;
  dress: string;
  client: string;
  date: string;
}

const Menu = () => {
  const { user } = useAuth();
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayRentals, setSelectedDayRentals] = useState<any[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<DeliveryItem[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<DeliveryItem[]>([]); const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingActivities();
  }, []);

  const loadUpcomingActivities = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      // Ejecutar ambas queries en paralelo
      const [deliveriesResult, returnsResult] = await Promise.all([
        supabase
          .from('Orders')
          .select(`
            id,
            delivery_date,
            Products!product_id (name),
            Customers!customer_id (name, last_name, phone)
          `)
          .gte('delivery_date', todayStr)
          .in('status', ['on_course', 'pending'])
          .order('delivery_date', { ascending: true })
          .limit(5),
        supabase
          .from('Orders')
          .select(`
            id,
            due_date,
            Products!product_id (name),
            Customers!customer_id (name, last_name, phone)
          `)
          .gte('due_date', todayStr)
          .in('status', ['on_course', 'pending'])
          .order('due_date', { ascending: true })
          .limit(5)
      ]);

      if (deliveriesResult.error) {
        console.error('Error loading deliveries:', deliveriesResult.error);
      }

      if (deliveriesResult.data) {
        const mappedDeliveries: DeliveryItem[] = deliveriesResult.data.map((order: any) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';

          const dressName = order.Products?.name || 'Vestido desconocido';
          const deliveryDate = new Date(order.delivery_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return {
            id: order.id,
            dress: dressName,
            client: customerName,
            date: deliveryDate,
          };
        });
        setUpcomingDeliveries(mappedDeliveries);
      }

      if (returnsResult.error) {
        console.error('Error loading returns:', returnsResult.error);
        setLoading(false);
        return;
      }

      const returns = returnsResult.data;

      if (returns) {
        const mappedReturns: DeliveryItem[] = returns.map((order: any) => {
          const customerName = order.Customers
            ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
            : 'Cliente desconocido';

          const dressName = order.Products?.name || 'Vestido desconocido';
          const returnDate = new Date(order.due_date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          return {
            id: order.id,
            dress: dressName,
            client: customerName,
            date: returnDate,
          };
        });
        setUpcomingReturns(mappedReturns);
      }
    } catch (error) {
      console.error('Error loading upcoming activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (query) {
      toast.success(`Buscando: ${query}`);
    }
  };

  const handleReserveDress = () => {
    setIsRentModalOpen(true);
  };

  const handleRentalAdded = () => {
    loadUpcomingActivities();
  };

  const handleDayClick = async (date: Date, activities: any[]) => {
    setSelectedDate(date);

    // Obtener detalles completos de las órdenes para mostrar info financiera
    const orderIds = activities.map(a => a.orderId).filter((id, index, self) =>
      self.indexOf(id) === index // unique IDs
    );

    if (orderIds.length === 0) {
      setSelectedDayRentals([]);
      setIsDayDetailsModalOpen(true);
      return;
    }

    try {
      const { data: orders, error } = await supabase
        .from('Orders')
        .select(`
          id,
          product_id,
          customer_id,
          status,
          advance_payment,
          penalty_fee,
          delivery_date,
          due_date,
          created_at,
          Products!product_id(name),
          Customers!customer_id(name, last_name)
        `)
        .in('id', orderIds);

      if (error) {
        toast.error('Error al cargar detalles de las rentas');
        return;
      }

      // Mapear a formato RentalDetail
      const rentals = orders?.map((order: any) => {
        const clientName = order.Customers
          ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
          : 'Cliente';
        const dressName = order.Products?.name || 'Vestido';
        const advance = order.advance_payment || 0;
        const penaltyFee = order.penalty_fee || 0;
        const total = advance + penaltyFee;
        const remaining = total - advance;

        // Determinar tipo de actividad para este día
        const dateStr = date.toISOString().split('T')[0];
        const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
        const dueDate = new Date(order.due_date).toISOString().split('T')[0];

        let activityType: 'delivery' | 'event' | 'return' = 'event';
        if (deliveryDate === dateStr) activityType = 'delivery';
        else if (dueDate === dateStr) activityType = 'return';

        return {
          id: order.id,
          clientName,
          dressName,
          status: order.status,
          advance,
          total,
          remaining,
          activityType,
          productId: order.product_id,
        };
      }) || [];

      setSelectedDayRentals(rentals);
      setIsDayDetailsModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar rentas');
    }
  };

  const handleDeliveryItemClick = async (item: DeliveryItem) => {
    try {
      const { data: order, error } = await supabase
        .from('Orders')
        .select(`
          id,
          product_id,
          customer_id,
          status,
          advance_payment,
          penalty_fee,
          delivery_date,
          due_date,
          created_at,
          Products!product_id(name),
          Customers!customer_id(name, last_name)
        `)
        .eq('id', item.id)
        .single();

      if (error || !order) {
        toast.error('Error al cargar detalles de la renta');
        return;
      }

      // Handle Customers and Products data
      const customerData = Array.isArray(order.Customers) ? order.Customers[0] : order.Customers;
      const productData = Array.isArray(order.Products) ? order.Products[0] : order.Products;

      const clientName = customerData
        ? `${customerData.name}${customerData.last_name ? ` ${customerData.last_name}` : ''}`
        : 'Cliente';
      const dressName = productData?.name || 'Vestido';
      const advance = order.advance_payment || 0;
      const penaltyFee = order.penalty_fee || 0;
      const total = advance + penaltyFee;
      const remaining = total - advance;

      // Determinar tipo de actividad basado en la fecha de hoy vs las fechas del pedido
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deliveryDate = new Date(order.delivery_date);
      deliveryDate.setHours(0, 0, 0, 0);
      const dueDate = new Date(order.due_date);
      dueDate.setHours(0, 0, 0, 0);

      let activityType: 'delivery' | 'event' | 'return' = 'delivery';
      if (dueDate.getTime() === today.getTime()) {
        activityType = 'return';
      } else if (deliveryDate.getTime() === today.getTime()) {
        activityType = 'delivery';
      }

      const rentalDetail = {
        id: order.id,
        clientName,
        dressName,
        status: order.status,
        advance,
        total,
        remaining,
        activityType,
        productId: order.product_id,
      };

      setSelectedDayRentals([rentalDetail]);
      setSelectedDate(new Date()); // Usar fecha actual
      setIsDayDetailsModalOpen(true);
    } catch (error) {
      toast.error('Error al cargar detalles');
    }
  };

  return (
    <StaffLayout>
      <LoginAlerts user={user} />
      <StaffHeader onSearch={handleSearch} />
      <main className="menu-content">
        <h1 className="menu-title">Menu</h1>

        {loading ? (
          <LoadingSpinner message="Cargando actividades..." />
        ) : (
          <>
            <div className="menu-cards-grid">
              <DeliveryCard
                title="Proximas Entregas"
                borderColor="#22c55e"
                badgeCount={upcomingDeliveries.length}
                empty={upcomingDeliveries.length === 0}
                emptyMessage="No hay entregas pendientes!"
                items={upcomingDeliveries}
                onItemClick={handleDeliveryItemClick}
              />

              <DeliveryCard
                title="Proximas Devoluciones"
                borderColor="#ef4444"
                badgeCount={upcomingReturns.length}
                empty={upcomingReturns.length === 0}
                emptyMessage="No hay devoluciones pendientes!"
                items={upcomingReturns}
                onItemClick={handleDeliveryItemClick}
              />

              <ReserveDressButton onClick={handleReserveDress} />
            </div>

            <div className="calendar-section">
              <StaffCalendar onDayClick={handleDayClick} />
            </div>
          </>
        )}
      </main>

      <RentDressModal
        isOpen={isRentModalOpen}
        onClose={() => setIsRentModalOpen(false)}
        onRentalCreated={handleRentalAdded}
      />

      <DayDetailsModal
        isOpen={isDayDetailsModalOpen}
        onClose={() => {
          setIsDayDetailsModalOpen(false);
          setSelectedDate(null);
          setSelectedDayRentals([]);
        }}
        selectedDate={selectedDate || new Date()}
        rentals={selectedDayRentals}
        onRefresh={loadUpcomingActivities}
      />
    </StaffLayout>
  );
};

export default Menu;
