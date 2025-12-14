import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { FiShoppingBag, FiCalendar, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import type { RentFormData } from './RentDressModal';
import type { Dress } from '../../pages/Catalogo';
import SelectDressModal from './SelectDressModal';
import '../../styles/RentDressSteps.css';
import 'react-datepicker/dist/react-datepicker.css';

interface RentDressStep2Props {
  formData: RentFormData;
  updateFormData: (data: Partial<RentFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  dresses: Dress[];
}

const RentDressStep2 = ({ formData, updateFormData, onNext, onPrevious, dresses }: RentDressStep2Props) => {
  const [selectedOption, setSelectedOption] = useState<'dress' | 'date'>(
    formData.eventDateSelected ? 'date' : formData.dressSelected ? 'dress' : 'dress'
  );
  const [isDressModalOpen, setIsDressModalOpen] = useState(false);
  const [eventDate, setEventDate] = useState<Date | null>(
    formData.fechaEntrega ? new Date(formData.fechaEntrega) : null
  );

  // Reset cuando cambia el formData desde fuera
  useEffect(() => {
    if (!formData.fechaEntrega) {
      setEventDate(null);
      setSelectedOption('dress');
    }
  }, [formData.fechaEntrega]);

  // Generar fechas basadas en la fecha del evento
  useEffect(() => {
    if (eventDate) {
      const entrega = new Date(eventDate);
      entrega.setDate(entrega.getDate() - 2); // 2 días antes del evento
      
      const devolucion = new Date(eventDate);
      devolucion.setDate(devolucion.getDate() + 1); // 1 día después del evento

      updateFormData({
        fechaEntrega: entrega.toLocaleDateString('es-ES'),
        fechaDevolucion: devolucion.toLocaleDateString('es-ES'),
      });
    }
  }, [eventDate, updateFormData]);

  const handleOptionChange = (option: 'dress' | 'date') => {
    setSelectedOption(option);
    updateFormData({
      dressSelected: option === 'dress',
      eventDateSelected: option === 'date',
    });
  };

  const handleDressSelect = (dress: Dress) => {
    updateFormData({
      selectedDress: dress.name,
      subtotal: dress.price,
    });
  };

  const handleDateChange = (date: Date | null) => {
    setEventDate(date);
    if (date) {
      updateFormData({
        eventDateSelected: true,
        dressSelected: false,
      });
      setSelectedOption('date');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="rent-step-form">
      <h3 className="step-title">Detalles del Vestido</h3>

      <div className="dress-option-buttons">
        <button
          type="button"
          className={`option-button ${selectedOption === 'dress' ? 'active' : ''}`}
          onClick={() => {
            handleOptionChange('dress');
            setIsDressModalOpen(true);
          }}
        >
          <FiShoppingBag />
          <span>{formData.selectedDress || 'Seleccionar Vestido'}</span>
        </button>
        <div className={`date-picker-wrapper ${eventDate ? 'active' : ''}`}>
          <DatePicker
            selected={eventDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            placeholderText="Fecha del Evento"
            className={`option-button date-picker-button ${eventDate ? 'active' : ''}`}
            calendarClassName="custom-calendar"
            wrapperClassName="date-picker-container"
            onClickOutside={() => {
              if (eventDate) {
                setSelectedOption('date');
              }
            }}
          />
          <FiCalendar className="date-picker-icon" />
        </div>
      </div>

      <SelectDressModal
        isOpen={isDressModalOpen}
        onClose={() => setIsDressModalOpen(false)}
        onSelect={handleDressSelect}
        dresses={dresses}
      />

      <div className="rental-summary">
        <h4 className="summary-title">Resumen de la renta</h4>
        <div className="summary-box">
          <div className="summary-row">
            <span className="summary-label">Vestido</span>
            <span className="summary-value">{formData.selectedDress || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha de entrega</span>
            <span className="summary-value">{formData.fechaEntrega || '---'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Fecha de devolucion</span>
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
        <button type="submit" className="btn-primary">
          Siguiente
          <FiArrowRight />
        </button>
      </div>
    </form>
  );
};

export default RentDressStep2;

