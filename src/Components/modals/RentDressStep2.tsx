import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { FiShoppingBag, FiCalendar, FiArrowLeft, FiArrowRight, FiAlertCircle, FiRepeat, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import type { RentFormData } from './RentDressModal';
import type { Dress } from '../../pages/Catalogo';
import SelectDressModal from './SelectDressModal';
import '../../styles/RentDressSteps.css';
import '../../styles/DateFirstSelection.css';
import '../../styles/OperationToggle.css';
import 'react-datepicker/dist/react-datepicker.css';

interface RentDressStep2Props {
  formData: RentFormData;
  updateFormData: (data: Partial<RentFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  dresses: Dress[];  // All dresses from parent
  onCheckAvailability?: (eventDate: Date) => Promise<Dress[]>;
}

const RentDressStep2 = ({
  formData,
  updateFormData,
  onNext,
  onPrevious,
  dresses,
  onCheckAvailability
}: RentDressStep2Props) => {
  const [eventDate, setEventDate] = useState<Date | null>(
    formData.fechaEntrega ? new Date(formData.fechaEntrega.split('/').reverse().join('-')) : null
  );
  const [availableDresses, setAvailableDresses] = useState<Dress[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [dateSelected, setDateSelected] = useState(!!formData.fechaEntrega);
  const [isDressModalOpen, setIsDressModalOpen] = useState(false);

  // Verificar disponibilidad cuando se selecciona una fecha
  const handleDateChange = async (date: Date | null) => {
    setEventDate(date);

    if (date && onCheckAvailability) {
      setCheckingAvailability(true);
      setDateSelected(true);

      try {
        const available = await onCheckAvailability(date);
        setAvailableDresses(available);

        // Calcular fechas de entrega y devolución
        const entrega = new Date(date);
        entrega.setDate(entrega.getDate() - 2); // 2 días antes del evento

        const devolucion = new Date(date);
        devolucion.setDate(devolucion.getDate() + 1); // 1 día después del evento

        updateFormData({
          fechaEntrega: entrega.toLocaleDateString('es-ES'),
          fechaDevolucion: devolucion.toLocaleDateString('es-ES'),
          eventDate: date.toLocaleDateString('es-ES'),
          eventDateSelected: true,
        });
      } catch (error) {
        toast.error('Error al verificar disponibilidad');
      } finally {
        setCheckingAvailability(false);
      }
    }
  };

  const handleDressSelect = (dress: Dress) => {
    console.log('[RentDressStep2] Dress selected:', {
      name: dress.name,
      rental_price: dress.rental_price,
      sales_price: dress.sales_price,
      operationType: formData.operationType,
    });

    // Ensure we have valid prices
    const rentalPrice = typeof dress.rental_price === 'number' && !isNaN(dress.rental_price)
      ? dress.rental_price
      : 0;

    const salesPrice = dress.sales_price != null && typeof dress.sales_price === 'number' && !isNaN(dress.sales_price)
      ? dress.sales_price
      : rentalPrice;

    // Calculate the appropriate price based on operation type
    const price = formData.operationType === 'sold' ? salesPrice : rentalPrice;

    console.log('[RentDressStep2] Calculated price:', {
      rentalPrice,
      salesPrice,
      finalPrice: price,
      operationType: formData.operationType,
    });

    if (price === 0) {
      console.warn('[RentDressStep2] WARNING: Price is 0 for dress:', dress.name);
      toast.error('Advertencia: El precio del vestido es $0. Verifica la configuración.');
    }

    updateFormData({
      selectedDress: dress.name,
      subtotal: price,
      sales_price: salesPrice !== rentalPrice ? salesPrice : undefined,
      dressSelected: true,
    });

    setIsDressModalOpen(false);
  };

  const handleOpenDressModal = () => {
    if (formData.operationType === 'rent' && !dateSelected) {
      toast.error('Primero selecciona la fecha del evento');
      return;
    }
    setIsDressModalOpen(true);
  };

  const canProceed = formData.operationType === 'sold'
    ? formData.selectedDress
    : (formData.selectedDress && formData.fechaEntrega && formData.fechaDevolucion);

  const isRent = formData.operationType === 'rent';
  const isSale = formData.operationType === 'sold';

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (canProceed) onNext(); }} className="rent-step-form">
      <h3 className="step-title">{isRent ? 'Detalles de la Renta' : 'Detalles de la Venta'}</h3>

      {/* Toggle Renta/Venta */}
      <div className="operation-type-toggle">
        <button
          type="button"
          className={`toggle-option ${isRent ? 'active' : ''}`}
          onClick={() => updateFormData({ operationType: 'rent' })}
        >
          <FiRepeat />
          <span>Renta</span>
        </button>
        <button
          type="button"
          className={`toggle-option ${isSale ? 'active' : ''}`}
          onClick={() => updateFormData({ operationType: 'sold' })}
        >
          <FiDollarSign />
          <span>Venta</span>
        </button>
      </div>

      {/* Paso 1: Seleccionar fecha (solo para rentas) */}
      {isRent && (
        <div className="date-first-section">
          <label className="section-label">
            <FiCalendar />
            <span>1. Selecciona la fecha del evento</span>
          </label>
          <div className={`date-picker-wrapper ${eventDate ? 'active' : ''}`}>
            <DatePicker
              selected={eventDate}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              placeholderText="Selecciona la fecha del evento"
              className={`option-button date-picker-button ${eventDate ? 'active' : ''}`}
              calendarClassName="custom-calendar"
              wrapperClassName="date-picker-container"
              disabled={checkingAvailability}
            />
            <FiCalendar className="date-picker-icon" />
          </div>
          {checkingAvailability && (
            <p className="loading-text">Verificando disponibilidad...</p>
          )}
          {dateSelected && !checkingAvailability && (
            <p className="success-text">✓ Fecha seleccionada: {eventDate?.toLocaleDateString('es-ES')}</p>
          )}
        </div>
      )}

      {/* Paso 2: Seleccionar vestido */}
      <div className={`dress-selection-section ${(isRent && !dateSelected) ? 'disabled' : ''}`}>
        <label className="section-label">
          <FiShoppingBag />
          <span>{isRent ? '2. Selecciona el vestido' : '1. Selecciona el vestido a vender'}</span>
        </label>
        <button
          type="button"
          className={`select-dress-btn ${formData.selectedDress ? 'selected' : ''}`}
          onClick={handleOpenDressModal}
          disabled={(isRent && !dateSelected) || checkingAvailability}
        >
          <FiShoppingBag />
          <span>{formData.selectedDress || 'Seleccionar Vestido'}</span>
          {availableDresses.length > 0 && (
            <span className="available-count">{availableDresses.length} disponibles</span>
          )}
        </button>
        {isRent && !dateSelected && (
          <div className="warning-message">
            <FiAlertCircle />
            <span>Primero debes seleccionar la fecha del evento</span>
          </div>
        )}
      </div>

      <SelectDressModal
        isOpen={isDressModalOpen}
        onClose={() => setIsDressModalOpen(false)}
        onSelect={handleDressSelect}
        dresses={formData.operationType === 'sold' ? dresses : availableDresses}
      />

      {/* Resumen */}
      <div className="rental-summary">
        <h4 className="summary-title">Resumen de la renta</h4>
        <div className="summary-box">
          <div className="summary-row">
            <span className="summary-label">Vestido</span>
            <span className="summary-value">{formData.selectedDress || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha del evento</span>
            <span className="summary-value">{eventDate?.toLocaleDateString('es-ES') || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha de entrega</span>
            <span className="summary-value">{formData.fechaEntrega || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha de devolución</span>
            <span className="summary-value">{formData.fechaDevolucion || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Subtotal</span>
            <span className="summary-value">{formData.subtotal > 0 ? `$${formData.subtotal}` : '$--'}</span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onPrevious}>
          <FiArrowLeft />
          Anterior
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={!canProceed}
        >
          Siguiente
          <FiArrowRight />
        </button>
      </div>
    </form>
  );
};

export default RentDressStep2;
