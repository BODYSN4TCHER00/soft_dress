import logoImage from '../../assets/image.png';
import '../../styles/MagnifiqueLogo.css';

interface MagnifiqueLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  className?: string;
}

const MagnifiqueLogo = ({ 
  size = 'medium', 
  showTagline = false,
  className = '' 
}: MagnifiqueLogoProps) => {
  return (
    <div className={`magnifique-logo ${size} ${className}`}>
      <img 
        src={logoImage} 
        alt="Magnifique Vestidos - Renta de vestidos" 
        className="logo-image"
      />
    </div>
  );
};

export default MagnifiqueLogo;
