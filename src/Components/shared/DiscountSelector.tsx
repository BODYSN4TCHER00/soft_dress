import { FiPercent, FiCheck } from 'react-icons/fi';
import '../../styles/DiscountSelector.css';

interface DiscountSelectorProps {
    selectedDiscount: number;
    onSelect: (discount: number) => void;
}

const DISCOUNT_OPTIONS = [10, 20, 30, 50, 100];

const DiscountSelector = ({ selectedDiscount, onSelect }: DiscountSelectorProps) => {
    return (
        <div className="discount-selector">
            <div className="discount-header">
                <FiPercent className="discount-header-icon" />
                <h3>Descuento para Cliente Frecuente</h3>
            </div>
            <p className="discount-description">
                Selecciona el porcentaje de descuento a aplicar
            </p>
            <div className="discount-options">
                {DISCOUNT_OPTIONS.map((discount) => (
                    <button
                        key={discount}
                        type="button"
                        className={`discount-option ${selectedDiscount === discount ? 'selected' : ''}`}
                        onClick={() => onSelect(discount)}
                    >
                        {selectedDiscount === discount && (
                            <FiCheck className="check-icon" />
                        )}
                        <span className="discount-value">{discount}%</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DiscountSelector;
