// src/components/HeroSection.tsx

import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react'; 
// Хук все еще нужен для определения режима (для оверлея и текста)

export function HeroSection() {

  const backgroundImagePath = '/light.jfif'; 

  const overlayClasses = 'bg-gradient-to-t from-black/80 via-black/60 to-black/40';

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-xl border bg-background shadow-xl mb-12 group">
      
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 scale-105 blur-sm"
        style={{ 
          backgroundImage: `url('${backgroundImagePath}')`
        }}
      />

      {/* 2. Статический тёмный градиентный оверлей для контраста */}
      <div 
        className={`absolute inset-0 z-10 ${overlayClasses}`} 
      />

      {/* 3. Контент (Оставляем белым для контраста с темным оверлеем) */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6 md:p-12 animate-in fade-in zoom-in duration-700">
        

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 drop-shadow-2xl max-w-4xl">
          Карточкин <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Эпические Карточные Приключения
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl mb-10 leading-relaxed drop-shadow-md">
          Соберите отряд, бросьте кости и отправляйтесь в подземелья, 
          где каждый ход может стать решающим. Славу обретут только смелые.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link to="/game/start">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto font-semibold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105"
            >
              Начать игру
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/rules">
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 h-auto border-white/20 bg-white/5 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all"
            >
              Как играть?
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}