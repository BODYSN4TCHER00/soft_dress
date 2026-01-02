import '../../styles/DressFilters.css';

interface DressFiltersProps {
  activeFilters: Set<string>;
  onFilterToggle: (filter: string) => void;
}

const filters = ['Disponible', 'Rentado', 'Mantenimiento'];

const DressFilters = ({ activeFilters, onFilterToggle }: DressFiltersProps) => {
  return (
    <div className="dress-filters-container">
      <div className="dress-filters">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`filter-tab ${activeFilters.has(filter) ? 'active' : ''}`}
            onClick={() => onFilterToggle(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {activeFilters.size > 0 && (
        <div className="active-filters">
          <span className="controls-label">Filtros activos:</span>
          {Array.from(activeFilters).map((filter) => (
            <span key={filter} className="filter-tag">
              {filter}
              <button onClick={() => onFilterToggle(filter)}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DressFilters;

