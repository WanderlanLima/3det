import React, { ReactNode } from 'react';

interface StepTemplateProps {
  title: string;
  children: ReactNode;
  onNext?: () => void; // Optional: Function to call when moving to the next step
  onPrevious?: () => void; // Optional: Function to call when moving to the previous step
  canProceed?: boolean; // Optional: Control if the next button is enabled
  isFirstStep?: boolean; // Optional: Hide previous button if it's the first step
  isLastStep?: boolean; // Optional: Change next button text to "Finish" or similar
}

const StepTemplate: React.FC<StepTemplateProps> = ({
  title,
  children,
  onNext,
  onPrevious,
  canProceed = true,
  isFirstStep = false,
  isLastStep = false,
}) => {
  return (
    <div className="step-template p-4 md:p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2 dark:border-gray-600">{title}</h2>
      <div className="step-content mb-6">
        {children}
      </div>
      <div className="step-navigation flex justify-between mt-6 pt-4 border-t dark:border-gray-600">
        {!isFirstStep && (
          <button
            onClick={onPrevious}
            disabled={!onPrevious} // Disable if no function provided
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            Anterior
          </button>
        )} 
        {/* Placeholder for alignment if it's the first step */}
        {isFirstStep && <div />} 

        <button
          onClick={onNext}
          disabled={!onNext || !canProceed} // Disable if no function or cannot proceed
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {isLastStep ? 'Finalizar' : 'Próximo'}
        </button>
      </div>
    </div>
  );
};

export default StepTemplate;

