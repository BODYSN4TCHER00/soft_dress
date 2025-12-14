import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/RentalFilters.css';

interface RentalFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onDateFilterChange?: (startDate: Date | null, endDate: Date | null) => void;
}

const filters = ['Todos', 'Activo', 'Completado', 'Cancelado'];

const RentalFilters = ({ activeFilter, onFilterChange, onDateFilterChange }: RentalFiltersProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (onDateFilterChange) {
      onDateFilterChange(date, endDate);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (onDateFilterChange) {
      onDateFilterChange(startDate, date);
    }
  };

  return (
    <div className="rental-filters-container">
      <div className="rental-filters">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="date-filters">
        <div className="date-filter-item">
          <FiCalendar className="date-icon" />
          <DatePicker
            selected={startDate}
            onChange={handleStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Fecha inicio"
            dateFormat="dd/MM/yyyy"
            className="date-picker-input"
            calendarClassName="custom-calendar"
          />
        </div>
        <span className="date-separator">-</span>
        <div className="date-filter-item">
          <FiCalendar className="date-icon" />
          <DatePicker
            selected={endDate}
            onChange={handleEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="Fecha fin"
            dateFormat="dd/MM/yyyy"
            className="date-picker-input"
            calendarClassName="custom-calendar"
          />
        </div>
        {(startDate || endDate) && (
          <button
            className="clear-date-filter"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              if (onDateFilterChange) {
                onDateFilterChange(null, null);
              }
            }}
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

export default RentalFilters;

