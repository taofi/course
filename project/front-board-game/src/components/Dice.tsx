import React, { useState, useEffect } from 'react';

interface DiceProps {
  value: number;
  isSuccess?: boolean;
  className?: string;
}

export const Dice = ({ value, isSuccess, className = "" }: DiceProps) => {
  const [isRolling, setIsRolling] = useState(true);
  // Значение, которое отображается в конкретный момент
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    setIsRolling(true);

    // Интервал для быстрой смены цифр во время анимации
    const rollInterval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 100);

    // Завершаем анимацию через 800мс
    const timer = setTimeout(() => {
      clearInterval(rollInterval);
      setIsRolling(false);
      setDisplayValue(value); // Устанавливаем итоговое значение
    }, 800);

    return () => {
      clearInterval(rollInterval);
      clearTimeout(timer);
    };
  }, [value]);

  const dotsMap: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  const dots = dotsMap[displayValue] || [];

  return (
    <div className={`relative flex flex-col items-center gap-2 ${className}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dice-roll {
          0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
          20% { transform: rotate(180deg) scale(1.2); opacity: 1; }
          40% { transform: rotate(360deg) scale(1); }
          60% { transform: rotate(540deg) scale(1.1); }
          100% { transform: rotate(720deg) scale(1); }
        }
        .animate-dice-roll {
          animation: dice-roll 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards;
        }
      `}} />
      
      <div 
        className={`w-16 h-16 rounded-xl border-4 bg-white shadow-2xl grid grid-cols-3 grid-rows-3 p-2 gap-1 animate-dice-roll
          ${!isRolling && isSuccess === true ? 'border-green-500 shadow-green-500/20' : 
            !isRolling && isSuccess === false ? 'border-red-500 shadow-red-500/20' : 
            'border-slate-300'}
          transition-all duration-300
        `}
      >
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dots.includes(i) && (
              <div 
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200
                  ${isRolling ? 'bg-slate-300' : (isSuccess === false ? 'bg-red-500' : 'bg-slate-900')}
                `} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};