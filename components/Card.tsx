
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children, className, icon }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {icon && <div className="text-sky-500">{icon}</div>}
        </div>
        <div className="text-slate-600">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Card;
