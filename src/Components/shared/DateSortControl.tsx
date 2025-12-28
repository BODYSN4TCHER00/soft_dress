import { FiChevronDown, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import '../../styles/DateSortControl.css';

export type SortOption = {
    value: string;
    label: string;
    field: string;
    direction: 'asc' | 'desc';
};

interface DateSortControlProps {
    value: SortOption;
    onChange: (option: SortOption) => void;
    options: SortOption[];
}

const DateSortControl = ({ value, onChange, options }: DateSortControlProps) => {
    return (
        <div className="date-sort-control">
            <label className="sort-label">
                {value.direction === 'asc' ? <FiArrowUp className="sort-icon" /> : <FiArrowDown className="sort-icon" />}
                Ordenar por:
            </label>
            <div className="sort-select-wrapper">
                <select
                    className="sort-select"
                    value={value.value}
                    onChange={(e) => {
                        const selected = options.find(opt => opt.value === e.target.value);
                        if (selected) {
                            onChange(selected);
                        }
                    }}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <FiChevronDown className="select-arrow" />
            </div>
        </div>
    );
};

export default DateSortControl;
