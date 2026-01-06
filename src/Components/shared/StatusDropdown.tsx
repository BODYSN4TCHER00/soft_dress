import '../../styles/StatusDropdown.css';

interface StatusDropdownProps {
    currentStatus: 'Pendiente' | 'En Curso' | 'Finalizado' | 'Cancelado';
    onStatusChange: (newStatus: 'Pendiente' | 'En Curso' | 'Finalizado' | 'Cancelado') => void;
}

const StatusDropdown = ({ currentStatus, onStatusChange }: StatusDropdownProps) => {
    const getStatusClass = (status: string) => {
        switch (status) {
            case 'Finalizado':
                return 'status-select completed';
            case 'Cancelado':
                return 'status-select cancelled';
            case 'En Curso':
                return 'status-select active';
            case 'Pendiente':
                return 'status-select pending';
            default:
                return 'status-select';
        }
    };

    return (
        <select
            className={getStatusClass(currentStatus)}
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value as typeof currentStatus)}
            onClick={(e) => e.stopPropagation()}
        >
            <option value="Pendiente">Pendiente</option>
            <option value="En Curso">En Curso</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cancelado">Cancelado</option>
        </select>
    );
};

export default StatusDropdown;
