import { useState } from 'react';
import { FiCalendar } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/DateRangeFilter.css';

interface DateRangeFilterProps {
  onDateChange: (start: Date | null, end: Date | null) => void;
  className?: string;
}

const DateRangeFilter = ({ onDateChange, className = '' }: DateRangeFilterProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    onDateChange(date, endDate);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    onDateChange(startDate, date);
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
    onDateChange(null, null);
  };

  return (
    <div className={`date-range-filter ${className}`}>
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
          onClick={clearDates}
        >
          Limpiar
        </button>
      )}
    </div>
  );
};

export default DateRangeFilter;

