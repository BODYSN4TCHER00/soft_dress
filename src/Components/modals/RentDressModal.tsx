import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../utils/context/AuthContext';
import RentDressStep1 from './RentDressStep1';
import RentDressStep2 from './RentDressStep2';
import RentDressStep3 from './RentDressStep3';
import Stepper from './Stepper';
import type { Dress } from '../../pages/Catalogo';
import '../../styles/RentDressModal.css';

interface RentDressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRentalCreated?: () => void;
}

export interface RentFormData {
  // Step 1 - Cliente
  clientType: 'new' | 'registered';
  nombre: string;
  apellido: string;
  telefono: string;
  segundoTelefono?: string;
  address: string;
  ineFile: File | null;

  // Step 2 - Vestido
  dressSelected: boolean;
  eventDateSelected: boolean;
  selectedDress: string;
  fechaEntrega: string;
  fechaDevolucion: string;
  eventDate?: string; // NUEVA: fecha del evento
  subtotal: number;

  // Step 3 - Finalizar
  notas?: string;
  adelanto?: number;
  contractPdfBlob?: Blob;
  discount_percentage?: number;
  discount_amount?: number;
  customerStatus?: string | null;
  customerId?: number;

  // Venta de vestidos
  operationType: 'rent' | 'sold';
  sales_price?: number;
}

// Constantes
const INITIAL_FORM_DATA: RentFormData = {
  clientType: 'new',
  nombre: '',
  apellido: '',
  telefono: '',
  segundoTelefono: '',
  address: '',
  ineFile: null,
  dressSelected: false,
  eventDateSelected: false,
  selectedDress: '',
  fechaEntrega: '',
  fechaDevolucion: '',
  subtotal: 0,
  operationType: 'rent',
};

const STORAGE_BUCKETS = {
  INE_IMAGES: 'ine_images',
  CONTRACT_FILES: 'contract_files',
} as const;

const RentDressModal = ({ isOpen, onClose, onRentalCreated }: RentDressModalProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [dresses, setDresses] = useState<Dress[]>([]);
  const [formData, setFormData] = useState<RentFormData>(INITIAL_FORM_DATA);

  // Cargar vestidos desde Supabase
  useEffect(() => {
    if (!isOpen) return;

    const loadDresses = async () => {
      try {
        // Cargar TODOS los vestidos - la disponibilidad se determina por fechas, no por status
        const { data: products, error } = await supabase
          .from('Products')
          .select('*')
          .order('name', { ascending: true });

        if (error || !products) {
          console.error('[RentDressModal] Error loading dresses:', error);
          return;
        }

        console.log('[RentDressModal] Loaded products from DB:', products.length);

        const mappedDresses: Dress[] = products.map((product: any) => {
          // Ensure prices are numbers, not null/undefined/string
          const rentalPrice = typeof product.rental_price === 'number'
            ? product.rental_price
            : parseFloat(product.rental_price) || 0;

          const salesPrice = product.sales_price != null
            ? (typeof product.sales_price === 'number'
              ? product.sales_price
              : parseFloat(product.sales_price) || 0)
            : undefined;

          // Debug log for first dress to verify prices
          if (product.id === products[0]?.id) {
            console.log('[RentDressModal] Sample dress mapping:', {
              name: product.name,
              rental_price_raw: product.rental_price,
              rental_price_mapped: rentalPrice,
              sales_price_raw: product.sales_price,
              sales_price_mapped: salesPrice,
            });
          }

          return {
            id: product.id.toString(),
            name: product.name,
            rental_price: rentalPrice,
            sales_price: salesPrice,
            rentals: 0,
            available: product.status === 'available',
            image: product.image_url || undefined,
            description: product.description || undefined,
            details: product.details || undefined,
            notes: product.notes || undefined,
            status: product.status,
          };
        });

        console.log('[RentDressModal] Mapped dresses:', mappedDresses.length);
        setDresses(mappedDresses);
      } catch (error) {
        console.error('[RentDressModal] Exception loading dresses:', error);
      }
    };

    loadDresses();
  }, [isOpen]);

  // Check dress availability for a given event date
  const checkDressAvailability = async (eventDate: Date): Promise<Dress[]> => {
    try {
      // Calculate buffer range (±2 days)
      const bufferStart = new Date(eventDate);
      bufferStart.setDate(bufferStart.getDate() - 2);

      const bufferEnd = new Date(eventDate);
      bufferEnd.setDate(bufferEnd.getDate() + 1);

      const bufferStartStr = bufferStart.toISOString().split('T')[0];
      const bufferEndStr = bufferEnd.toISOString().split('T')[0];

      // Get all active/pending rentals with both delivery and return dates
      const { data: allRentals, error } = await supabase
        .from('Orders')
        .select('product_id, delivery_date, due_date')
        .in('status', ['pending', 'on_course']);

      if (error) {
        return dresses;
      }

      // Filter rentals that overlap with our requested range
      // Overlap exists if: (rental.delivery <= bufferEnd) AND (rental.return >= bufferStart)
      const conflictingRentals = allRentals?.filter(rental => {
        return rental.delivery_date <= bufferEndStr && rental.due_date >= bufferStartStr;
      }) || [];

      // Get occupied dress IDs
      const occupiedDressIds = new Set(
        conflictingRentals.map(r => r.product_id.toString())
      );

      // Filter available dresses
      const available = dresses.filter(
        dress => !occupiedDressIds.has(dress.id)
      );

      return available;
    } catch (error) {
      return dresses;
    }
  };

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const uploadINE = async (file: File): Promise<string | null> => {
    try {
      if (!file || file.size === 0) {
        toast.error('El archivo de INE está vacío o es inválido');
        return null;
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.INE_IMAGES)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        let errorMessage = 'Error al subir INE';
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
          errorMessage = 'El bucket ine_images no existe o no tienes permisos. Contacta al administrador.';
        } else if (error.message?.includes('permission') || error.message?.includes('denied')) {
          errorMessage = 'No tienes permisos para subir archivos. Contacta al administrador.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
        toast.error(errorMessage);
        return null;
      }

      if (!data?.path) {
        toast.error('Error: No se recibió la ruta del archivo subido');
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.INE_IMAGES)
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        toast.error('Error al obtener la URL del archivo');
        return null;
      }

      return urlData.publicUrl;
    } catch (error) {
      toast.error(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return null;
    }
  };

  const uploadContract = async (pdfBlob: Blob, customerName: string): Promise<string | null> => {
    try {
      const fileName = `contrato-${customerName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.CONTRACT_FILES)
        .upload(fileName, pdfBlob, { contentType: 'application/pdf' });

      if (error || !data?.path) {
        toast.error('Error al subir contrato');
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.CONTRACT_FILES)
        .getPublicUrl(data.path);

      return urlData?.publicUrl || null;
    } catch (error) {
      // Error silencioso
      toast.error('Error inesperado al subir contrato');
      return null;
    }
  };

  const getOrCreateCustomer = async (formData: RentFormData): Promise<number | null> => {
    if (formData.clientType === 'registered') {
      const { data: existingCustomer } = await supabase
        .from('Customers')
        .select('id')
        .eq('phone', formData.telefono)
        .single();

      if (existingCustomer) return existingCustomer.id;

      // Si no existe, crearlo
      const { data: newCustomer, error } = await supabase
        .from('Customers')
        .insert([{
          name: formData.nombre,
          last_name: formData.apellido,
          phone: formData.telefono,
          second_phone: formData.segundoTelefono || null,
          address: formData.address || null,
          email: '',
        }])
        .select()
        .single();

      if (error || !newCustomer) {
        return null;
      }

      return newCustomer.id;
    }

    // Cliente nuevo - subir INE primero
    let ineUrl: string | null = null;
    if (formData.ineFile) {
      toast.loading('Subiendo INE...', { id: 'upload-ine' });
      ineUrl = await uploadINE(formData.ineFile);

      if (ineUrl) {
        toast.success('INE subido exitosamente', { id: 'upload-ine' });
      } else {
        toast.dismiss('upload-ine');
      }
    }

    const customerData: any = {
      name: formData.nombre,
      last_name: formData.apellido,
      phone: formData.telefono,
      second_phone: formData.segundoTelefono || null,
      address: formData.address || null,
      email: '',
    };

    if (ineUrl) {
      customerData.ine_url = ineUrl;
    }

    const { data: newCustomer, error } = await supabase
      .from('Customers')
      .insert([customerData])
      .select()
      .single();

    if (error || !newCustomer) {
      return null;
    }

    return newCustomer.id;
  };

  const handleFinish = async (finalFormData: RentFormData) => {
    try {
      toast.loading('Procesando renta...', { id: 'rental-process' });

      // 1. Crear o buscar cliente
      const customerId = await getOrCreateCustomer(finalFormData);
      if (!customerId) {
        toast.error('Error al crear o buscar cliente', { id: 'rental-process' });
        return;
      }

      // 2. Buscar producto
      const { data: product, error: productError } = await supabase
        .from('Products')
        .select('id')
        .eq('name', finalFormData.selectedDress)
        .single();

      if (productError || !product) {
        toast.error('Error al buscar el vestido', { id: 'rental-process' });
        return;
      }

      // 3. Subir contrato PDF si existe
      let contractUrl: string | null = null;
      if (finalFormData.contractPdfBlob) {
        contractUrl = await uploadContract(
          finalFormData.contractPdfBlob,
          `${finalFormData.nombre}-${finalFormData.apellido}`
        );
      }

      // 4. Crear orden
      const deliveryDate = parseDateString(finalFormData.fechaEntrega);
      const returnDate = parseDateString(finalFormData.fechaDevolucion);
      const eventDate = finalFormData.eventDate ? parseDateString(finalFormData.eventDate) : deliveryDate;

      const orderData: any = {
        product_id: product.id,
        customer_id: customerId,
        staff_id: user?.id || null,
        delivery_date: finalFormData.operationType === 'rent' ? deliveryDate : null,
        due_date: finalFormData.operationType === 'rent' ? returnDate : null,
        event_date: finalFormData.operationType === 'rent' ? eventDate : null,
        notes: finalFormData.notas || null,
        status: finalFormData.operationType === 'sold' ? 'completed' : 'pending',
        advance_payment: finalFormData.operationType === 'rent' ? (finalFormData.adelanto || 0) : finalFormData.subtotal,
        discount: finalFormData.discount_amount || 0,  // Descuento disponible para ambos
      };

      if (contractUrl) orderData.contract_url = contractUrl;

      const { data: newOrder, error: orderError } = await supabase
        .from('Orders')
        .insert([orderData])
        .select()
        .single();

      if (orderError || !newOrder) {
        toast.error('Error al crear la orden', { id: 'rental-process' });
        return;
      }

      // Si es venta, actualizar status del vestido a 'sold'
      if (finalFormData.operationType === 'sold') {
        const { error: updateError } = await supabase
          .from('Products')
          .update({ status: 'sold' })
          .eq('id', product.id);

        if (updateError) {
          // No bloqueamos aunque falle el update del status
        }
      }

      toast.success(
        finalFormData.operationType === 'sold' ? 'Venta creada exitosamente' : 'Renta creada exitosamente',
        { id: 'rental-process' }
      );
      onRentalCreated?.();
      handleClose();
    } catch (error) {
      toast.error('Error inesperado al crear la renta', { id: 'rental-process' });
    }
  };

  const parseDateString = (dateString: string): string => {
    const [day, month, year] = dateString.split('/').map(Number);
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const updateFormData = (data: Partial<RentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="rent-dress-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Rentar Vestido</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <Stepper currentStep={currentStep} />

        <div className="modal-body">
          {currentStep === 1 && (
            <RentDressStep1
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onAutoNext={handleNext}
            />
          )}
          {currentStep === 2 && (
            <RentDressStep2
              formData={formData}
              updateFormData={updateFormData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              dresses={dresses}
              onCheckAvailability={checkDressAvailability}
            />
          )}
          {currentStep === 3 && (
            <RentDressStep3
              formData={formData}
              updateFormData={updateFormData}
              onPrevious={handlePrevious}
              onFinish={() => handleFinish(formData)}
              onContractGenerated={(pdfBlob: Blob) => {
                updateFormData({ contractPdfBlob: pdfBlob });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RentDressModal;

