import '../../styles/FilterTabs.css';

interface FilterTabsProps {
  filters: string[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

const FilterTabs = ({ filters, activeFilter, onFilterChange, className = '' }: FilterTabsProps) => {
  return (
    <div className={`filter-tabs-container ${className}`}>
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
  );
};

export default FilterTabs;

