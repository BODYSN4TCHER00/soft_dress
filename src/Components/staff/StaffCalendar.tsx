import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'react-hot-toast';
import CalendarDayModal from './CalendarDayModal';
import LoadingSpinner from '../shared/LoadingSpinner';
import '../../styles/StaffCalendar.css';

interface CalendarActivity {
  id: number;
  type: 'delivery' | 'return' | 'rental';
  dress: string;
  client: string;
  time?: string;
  status?: string;
  orderId: number;
}

interface OrderFromDB {
  id: number;
  product_id: number | null;
  customer_id: number | null;
  delivery_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  created_at: string;
  Products: { name: string } | null;
  Customers: { name: string; last_name: string | null; phone: string | null } | null;
}

interface StaffCalendarProps {
  onRentalAdded?: () => void;
}

const StaffCalendar = ({ onRentalAdded }: StaffCalendarProps = {}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState<OrderFromDB[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const weekDays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  useEffect(() => {
    loadOrders();
  }, [currentDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Calcular rango de fechas del mes
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Cargar todas las órdenes y filtrar en el cliente
      // Necesitamos órdenes que tengan:
      // - delivery_date en el rango del mes
      // - due_date en el rango del mes
      // - created_at en el rango del mes
      const { data, error } = await supabase
        .from('Orders')
        .select(`
          *,
          Products:product_id (name),
          Customers:customer_id (name, last_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast.error('Error al cargar las actividades');
        return;
      }

      if (data) {
        // Filtrar órdenes que tengan alguna actividad en el mes actual
        const filteredOrders = data.filter((order: OrderFromDB) => {
          const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
          const dueDate = new Date(order.due_date).toISOString().split('T')[0];
          const createdDate = new Date(order.created_at).toISOString().split('T')[0];
          
          return (
            (deliveryDate >= startDateStr && deliveryDate <= endDateStr) ||
            (dueDate >= startDateStr && dueDate <= endDateStr) ||
            (createdDate >= startDateStr && createdDate <= endDateStr)
          );
        });
        
        setOrders(filteredOrders as OrderFromDB[]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Lunes = 0

    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isSelected = (day: number) => {
    if (selectedDay === null) return false;
    return day === selectedDay;
  };

  const isDeliveryDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    return orders.some(order => {
      const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
      return deliveryDate === dateStr;
    });
  };

  const isReturnDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    return orders.some(order => {
      const dueDate = new Date(order.due_date).toISOString().split('T')[0];
      return dueDate === dateStr;
    });
  };

  const hasRentalCreated = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    return orders.some(order => {
      const createdDate = new Date(order.created_at).toISOString().split('T')[0];
      return createdDate === dateStr;
    });
  };

  const getDayActivities = (day: number): CalendarActivity[] => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const activities: CalendarActivity[] = [];
    
    orders.forEach(order => {
      const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
      const dueDate = new Date(order.due_date).toISOString().split('T')[0];
      const createdDate = new Date(order.created_at).toISOString().split('T')[0];
      
      const customerName = order.Customers
        ? `${order.Customers.name}${order.Customers.last_name ? ` ${order.Customers.last_name}` : ''}`
        : 'Cliente desconocido';
      
      const dressName = order.Products?.name || 'Vestido desconocido';
      
      // Agregar actividad de renta creada
      if (createdDate === dateStr) {
        activities.push({
          id: order.id,
          type: 'rental',
          dress: dressName,
          client: customerName,
          status: order.status,
          orderId: order.id,
        });
      }
      
      // Agregar actividad de entrega
      if (deliveryDate === dateStr) {
        activities.push({
          id: order.id,
          type: 'delivery',
          dress: dressName,
          client: customerName,
          status: order.status,
          orderId: order.id,
        });
      }
      
      // Agregar actividad de devolución
      if (dueDate === dateStr) {
        activities.push({
          id: order.id,
          type: 'return',
          dress: dressName,
          client: customerName,
          status: order.status,
          orderId: order.id,
        });
      }
    });
    
    return activities;
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatSelectedDate = (day: number): string => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthName = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <div className="staff-calendar">
      {loading ? (
        <LoadingSpinner message="Cargando calendario..." />
      ) : (
        <>
          <div className="calendar-header">
        <button className="calendar-nav-button" onClick={prevMonth}>
          <FiChevronLeft />
        </button>
        <h2 className="calendar-month-year">
          {monthName} de {year}
        </h2>
        <button className="calendar-nav-button" onClick={nextMonth}>
          <FiChevronRight />
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-days">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={index} className="calendar-day empty"></div>;
          }

          const weekend = isWeekend(day);
          const selected = isSelected(day);
          const delivery = isDeliveryDate(day);
          const returnDate = isReturnDate(day);
          const rentalCreated = hasRentalCreated(day);

          return (
            <div
              key={day}
              className={`calendar-day ${selected ? 'selected' : ''} ${weekend ? 'weekend' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className="calendar-day-number">{day}</span>
              <div className="calendar-day-indicators">
                {rentalCreated && <span className="calendar-indicator rental"></span>}
                {delivery && <span className="calendar-indicator delivery"></span>}
                {returnDate && <span className="calendar-indicator return"></span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot rental"></span>
          <span>Renta creada</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot delivery"></span>
          <span>Fecha de entrega</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot return"></span>
          <span>Fecha de devolucion</span>
        </div>
      </div>

          <CalendarDayModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedDay(null);
            }}
            date={selectedDay ? formatSelectedDate(selectedDay) : ''}
            activities={selectedDay ? getDayActivities(selectedDay) : []}
            onStatusChange={loadOrders}
          />
        </>
      )}
    </div>
  );
};

export default StaffCalendar;

