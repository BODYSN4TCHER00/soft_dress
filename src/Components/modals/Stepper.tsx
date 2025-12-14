import { FiCheck } from 'react-icons/fi';
import '../../styles/Stepper.css';

interface StepperProps {
  currentStep: number;
}

const Stepper = ({ currentStep }: StepperProps) => {
  const steps = [
    { number: 1, label: 'Cliente' },
    { number: 2, label: 'Vestido' },
    { number: 3, label: 'Finalizar Renta' },
  ];

  return (
    <div className="stepper">
      {steps.map((step) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isPending = step.number > currentStep;

        return (
          <div
            key={step.number}
            className={`stepper-step ${isCompleted ? 'completed' : ''}`}
          >
            <div className={`stepper-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}>
              {isCompleted ? <FiCheck /> : step.number}
            </div>
            <span className={`stepper-label ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''}`}>
              {step.number} {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;

