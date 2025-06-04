
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      <p className="mt-4 text-lg text-slate-300">Carregando...</p>
    </div>
  );
};

export default LoadingSpinner;
