import React from 'react';

interface CardBackProps {
  type: 'door' | 'treasure';
  className?: string;
}

export const CardBack: React.FC<CardBackProps> = ({ type, className = "" }) => {
  const isDoor = type === 'door';
  const bgImage = isDoor ? '/doors.png' : '/treasures.png';

  return (
    <div className={`
      relative aspect-[5/7] w-full rounded-md border-2 overflow-hidden shadow-md
      transition-transform duration-300 hover:shadow-xl group
      ${isDoor ? 'border-amber-900/20 bg-stone-200' : 'border-yellow-600/20 bg-amber-50'}
      ${className}
    `}>
      <img 
          src={bgImage} 
          alt={`${type} card back`}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
        />

      {/* Световой блик сверху для объема */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
    </div>
  );
};