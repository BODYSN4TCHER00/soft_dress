import '../../styles/DressFilters.css';

interface DressFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = ['Todos', 'Disponible', 'Rentado', 'Mantenimiento'];

const DressFilters = ({ activeFilter, onFilterChange }: DressFiltersProps) => {
  return (
    <div className="dress-filters-container">
      <div className="dress-filters">
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
    </div>
  );
};

export default DressFilters;

