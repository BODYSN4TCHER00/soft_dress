import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/DateSelectionStep.css';

interface DateSelectionStepProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    onNext: () => void;
}

const DateSelectionStep = ({ selectedDate, onDateSelect, onNext }: DateSelectionStepProps) => {
    const [tempDate, setTempDate] = useState<Date | null>(selectedDate);

    const handleDateChange = (date: Date | null) => {
        setTempDate(date);
        if (date) {
            onDateSelect(date);
        }
    };

    const canProceed = tempDate !== null;

    return (
        <div className="date-selection-step">
            <div className="date-step-header">
                <FiCalendar className="calendar-icon-large" />
                <h3>Selecciona la fecha del evento</h3>
                <p className="date-step-description">
                    Primero elige cuándo será el evento para mostrarte los vestidos disponibles
                </p>
            </div>

            <div className="date-picker-container">
                <DatePicker
                    selected={tempDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Selecciona una fecha"
                    inline
                    calendarClassName="custom-date-picker"
                />
            </div>

            {tempDate && (
                <div className="selected-date-display">
                    <FiCalendar />
                    <span>
                        Fecha seleccionada: <strong>{tempDate.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}</strong>
                    </span>
                </div>
            )}

            <div className="date-step-actions">
                <button
                    className="btn-next"
                    onClick={onNext}
                    disabled={!canProceed}
                >
                    Continuar →
                </button>
            </div>

            {!canProceed && (
                <p className="helper-text">Selecciona una fecha para continuar</p>
            )}
        </div>
    );
};

export default DateSelectionStep;
