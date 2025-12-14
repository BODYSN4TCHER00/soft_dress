import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import StaffLayout from '../../Components/staff/StaffLayout';
import StaffHeader from '../../Components/staff/StaffHeader';
import DeliveryCard from '../../Components/staff/DeliveryCard';
import ReserveDressButton from '../../Components/staff/ReserveDressButton';
import StaffCalendar from '../../Components/staff/StaffCalendar';
import RentDressModal from '../../Components/modals/RentDressModal';
import LoginAlerts from '../../Components/alerts/LoginAlerts';
import LoadingSpinner from '../../Components/shared/LoadingSpinner';
import { useAuth } from '../../utils/context/AuthContext';
import { supabase } from '../../utils/supabase/client';
import '../../styles/StaffMenu.css';

interface OrderFromDB {
  id: number;
  product_id: number | null;
  customer_id: number | null;
  delivery_date: string;
  due_date: string;
  status: string;
  Products: { name: string } | null;
  Customers: { name: string; last_name: string | null; phone: string | null } | null;
}

interface DeliveryItem {
  dress: string;
  client: string;
  date: string;
}

const Menu = () => {
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<DeliveryItem[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadUpcomingActivities();
  }, []);

  const loadUpcomingActivities = async () => {
    try {
      setLoading(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Cargar próximas entregas (delivery_date >= hoy y status activo)
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('Orders')
        .select(`
          *,
          Products:product_id (name),
          Customers:customer_id (name, last_name, phone)
        `)
        .gte('delivery_date', todayStr)
        .in('status', ['active', 'pending'])
        .order('delivery_date', { ascending: true })
        .limit(5);

      if (deliveriesError) {
        console.error('Error loading deliveries:', deliveriesError);
        return;
      }

      if (deliveries) {
        const mappedDeliveries: DeliveryItem[] = deliveries.map((order: OrderFromDB) => {
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
            dress: dressName,
            client: customerName,
            date: deliveryDate,
          };
        });
        setUpcomingDeliveries(mappedDeliveries);
      }

      // Cargar próximas devoluciones (due_date >= hoy y status activo)
      const { data: returns, error: returnsError } = await supabase
        .from('Orders')
        .select(`
          *,
          Products:product_id (name),
          Customers:customer_id (name, last_name, phone)
        `)
        .gte('due_date', todayStr)
        .in('status', ['active', 'pending'])
        .order('due_date', { ascending: true })
        .limit(5);

      if (returnsError) {
        console.error('Error loading returns:', returnsError);
        return;
      }

      if (returns) {
        const mappedReturns: DeliveryItem[] = returns.map((order: OrderFromDB) => {
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

  const handleGenerateReport = () => {
    toast.success('Generando reporte...');
  };

  const handleReserveDress = () => {
    setIsRentModalOpen(true);
  };

  const handleRentalAdded = () => {
    loadUpcomingActivities();
  };

  return (
    <StaffLayout>
      <LoginAlerts user={user} />
      <StaffHeader onSearch={handleSearch} onGenerateReport={handleGenerateReport} />
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
          />
          
          <DeliveryCard
            title="Proximas Devoluciones"
            borderColor="#ef4444"
            badgeCount={upcomingReturns.length}
            empty={upcomingReturns.length === 0}
            emptyMessage="No hay devoluciones pendientes!"
            items={upcomingReturns}
          />
          
          <ReserveDressButton onClick={handleReserveDress} />
        </div>

            <div className="calendar-section">
              <StaffCalendar />
            </div>
          </>
        )}
      </main>

      <RentDressModal
        isOpen={isRentModalOpen}
        onClose={() => setIsRentModalOpen(false)}
        onRentalCreated={handleRentalAdded}
      />
    </StaffLayout>
  );
};

export default Menu;
