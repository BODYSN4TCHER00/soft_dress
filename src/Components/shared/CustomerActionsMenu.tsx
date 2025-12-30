import { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiEdit, FiEye, FiUserMinus, FiStar, FiX } from 'react-icons/fi';
import type { Customer } from '../../pages/admin/Clientes';
import '../../styles/CustomerActionsMenu.css';

interface CustomerActionsMenuProps {
    customer: Customer;
    onEdit: (customer: Customer) => void;
    onViewINE: (customer: Customer) => void;
    onToggleBlacklist: (customer: Customer) => void;
    onToggleFrequentCustomer: (customer: Customer) => void;
}

const CustomerActionsMenu = ({
    customer,
    onEdit,
    onViewINE,
    onToggleBlacklist,
    onToggleFrequentCustomer
}: CustomerActionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const closeMenu = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setIsOpen(false);
    };

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        closeMenu();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const isBlacklisted = customer.status === 'blacklisted';
    const isFrequentCustomer = customer.status === 'frecuent_customer';

    return (
        <div className="customer-actions-menu" ref={dropdownRef}>
            <button
                className="actions-trigger-btn"
                onClick={toggleMenu}
                title="Acciones"
            >
                <FiMoreVertical />
            </button>

            {isOpen && (
                <>
                    <div className="actions-overlay" onClick={closeMenu} />
                    <div className="actions-menu-dropdown">
                        <button
                            className="action-menu-item edit"
                            onClick={(e) => handleAction(e, () => onEdit(customer))}
                        >
                            <FiEdit className="action-menu-icon" />
                            <span className="action-menu-text">Editar</span>
                        </button>

                        <button
                            className="action-menu-item view"
                            onClick={(e) => handleAction(e, () => onViewINE(customer))}
                        >
                            <FiEye className="action-menu-icon" />
                            <span className="action-menu-text">Ver INE</span>
                        </button>

                        <div className="menu-divider" />

                        <button
                            className={`action-menu-item frequent ${isFrequentCustomer ? 'active' : ''}`}
                            onClick={(e) => handleAction(e, () => onToggleFrequentCustomer(customer))}
                        >
                            <FiStar className="action-menu-icon" />
                            <span className="action-menu-text">
                                {isFrequentCustomer ? 'Remover Cliente Frecuente' : 'Añadir a Cliente Frecuente'}
                            </span>
                        </button>

                        <button
                            className={`action-menu-item blacklist ${isBlacklisted ? 'active' : ''}`}
                            onClick={(e) => handleAction(e, () => onToggleBlacklist(customer))}
                        >
                            <FiUserMinus className="action-menu-icon" />
                            <span className="action-menu-text">
                                {isBlacklisted ? 'Remover de Lista Negra' : 'Añadir a Lista Negra'}
                            </span>
                        </button>

                        <button className="close-menu-btn" onClick={closeMenu}>
                            <FiX />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomerActionsMenu;
