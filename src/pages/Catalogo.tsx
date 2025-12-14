import { useState, useEffect, useMemo } from 'react';
import { FiPackage, FiCheckCircle, FiXCircle, FiTool, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SharedLayout from '../Components/shared/SharedLayout';
import StaffHeader from '../Components/staff/StaffHeader';
import DressCard from '../Components/shared/DressCard';
import DressFilters from '../Components/shared/DressFilters';
import SummaryCard from '../Components/shared/SummaryCard';
import FloatingActionButton from '../Components/staff/FloatingActionButton';
import AddDressModal from '../Components/modals/AddDressModal';
import LoadingSpinner from '../Components/shared/LoadingSpinner';
import { supabase } from '../utils/supabase/client';
import '../styles/Catalogo.css';

export interface Dress {
  id: string;
  name: string;
  price: number;
  rentals: number;
  available: boolean;
  image?: string;
  description?: string;
  details?: string;
  notes?: string;
  status?: string;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  details: string | null;
  notes: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  last_modified: string;
}

const Catalogo = () => {
  const [isAddDressModalOpen, setIsAddDressModalOpen] = useState(false);
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('Todos');

  useEffect(() => {
    loadProducts();
    // Actualizar estados automáticamente cada minuto
    const interval = setInterval(() => {
      updateDressStatuses();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, []);

  // Función para actualizar estados basado en rentas activas
  const updateDressStatuses = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Obtener todas las rentas activas
      const { data: activeOrders } = await supabase
        .from('Orders')
        .select('product_id, delivery_date, due_date, return_date, status')
        .in('status', ['active', 'pending']);

      if (!activeOrders) return;

      // Obtener todos los productos
      const { data: products } = await supabase
        .from('Products')
        .select('id, status');

      if (!products) return;

      // Actualizar estados
      for (const product of products) {
        const hasActiveRental = activeOrders.some(
          order => order.product_id === product.id && 
          order.status !== 'completed' && 
          order.status !== 'cancelled' &&
          (!order.return_date || new Date(order.return_date) >= new Date(today))
        );

        let newStatus = product.status;
        
        if (hasActiveRental && product.status !== 'rented') {
          newStatus = 'rented';
        } else if (!hasActiveRental && product.status === 'rented') {
          newStatus = 'available';
        }

        if (newStatus !== product.status) {
          await supabase
            .from('Products')
            .update({ status: newStatus })
            .eq('id', product.id);
        }
      }

      // Recargar productos
      loadProducts();
    } catch (error) {
      // Error silencioso
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data: products, error } = await supabase
        .from('Products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        toast.error('Error al cargar el catálogo');
        return;
      }

      if (products) {
        // Obtener conteo de rentas por producto
        const productsWithRentals = await Promise.all(
          products.map(async (product: Product) => {
            const { count } = await supabase
              .from('Orders')
              .select('*', { count: 'exact', head: true })
              .eq('product_id', product.id);

            return {
              id: product.id.toString(),
              name: product.name,
              price: product.price,
              rentals: count || 0,
              available: product.status === 'available',
              image: product.image_url || undefined,
              description: product.description || undefined,
              details: product.details || undefined,
              notes: product.notes || undefined,
              status: product.status,
            };
          })
        );

        setDresses(productsWithRentals);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar el catálogo');
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

  const handleAddDress = () => {
    setIsAddDressModalOpen(true);
  };

  const handleDressAdded = () => {
    loadProducts();
    setIsAddDressModalOpen(false);
  };

  const filteredDresses = dresses.filter(dress => {
    const matchesSearch = dress.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'Todos') return matchesSearch;
    if (activeFilter === 'Disponible') return matchesSearch && dress.status === 'available';
    if (activeFilter === 'Rentado') return matchesSearch && dress.status === 'rented';
    if (activeFilter === 'Mantenimiento') return matchesSearch && dress.status === 'maintenance';
    
    return matchesSearch;
  });

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalDresses = dresses.length;
    const availableDresses = dresses.filter(d => d.status === 'available').length;
    const rentedDresses = dresses.filter(d => d.status === 'rented').length;
    const maintenanceDresses = dresses.filter(d => d.status === 'maintenance').length;
    
    // Encontrar vestido más rentado
    const mostRented = dresses.length > 0
      ? dresses.reduce((max, dress) => (dress.rentals > max.rentals ? dress : max), dresses[0])
      : null;

    return {
      totalDresses,
      availableDresses,
      rentedDresses,
      maintenanceDresses,
      mostRented: mostRented ? `${mostRented.name} (${mostRented.rentals} rentas)` : 'N/A',
    };
  }, [dresses]);

  return (
    <SharedLayout>
      <StaffHeader onSearch={handleSearch} onGenerateReport={handleGenerateReport} />
      <main className="catalogo-content">
        <h1 className="catalogo-title">Catalogo de Vestidos</h1>

        <div className="summary-cards">
          <SummaryCard
            title="Total de Vestidos"
            value={stats.totalDresses}
            icon={<FiPackage />}
            variant="default"
          />
          <SummaryCard
            title="Disponibles"
            value={stats.availableDresses}
            icon={<FiCheckCircle />}
            variant="success"
          />
          <SummaryCard
            title="Rentados"
            value={stats.rentedDresses}
            icon={<FiXCircle />}
            variant="warning"
          />
          <SummaryCard
            title="Mantenimiento"
            value={stats.maintenanceDresses}
            icon={<FiTool />}
            variant="danger"
          />
          <SummaryCard
            title="Más Rentado"
            value={stats.mostRented}
            icon={<FiTrendingUp />}
            variant="default"
          />
        </div>

        <DressFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {loading ? (
          <LoadingSpinner message="Cargando catálogo..." />
        ) : (
          <>
            {filteredDresses.length === 0 ? (
              <div className="empty-state">
                <p>No hay vestidos en el catálogo</p>
              </div>
            ) : (
              <div className="dresses-grid">
                {filteredDresses.map((dress) => (
                  <DressCard key={dress.id} dress={dress} onStatusChange={loadProducts} />
                ))}
              </div>
            )}
          </>
        )}

        <FloatingActionButton onClick={handleAddDress} />

        <AddDressModal
          isOpen={isAddDressModalOpen}
          onClose={() => setIsAddDressModalOpen(false)}
          onDressAdded={handleDressAdded}
        />
      </main>
    </SharedLayout>
  );
};

export default Catalogo;

