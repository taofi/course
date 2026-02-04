import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { apiCards } from '@/services/apiCards';
import { GameCard } from '@/components/GameCard';
import type { ICardData, IDoorData } from '@munchkin/shared';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Layers } from "lucide-react";

export const Route = createFileRoute('/cards/')({
  component: CardsPage,
});

function CardsPage() {
  const [doors, setDoors] = useState<IDoorData[]>([]);
  const [treasures, setTreasures] = useState<ICardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State для модального окна
  const [activeCard, setActiveCard] = useState<ICardData | IDoorData | null>(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setIsLoading(true);
        const [doorsData, treasuresData] = await Promise.all([
          apiCards.getAllDoors(),
          apiCards.getAllTreasures()
        ]);
        setDoors(doorsData);
        setTreasures(treasuresData);
      } catch (error) {
        console.error("Ошибка при загрузке карт:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCards();
  }, []);

  // Фильтрация карт по поиску
  const filterCards = (cards: any[]) => 
    cards.filter(card => 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            БИБЛИОТЕКА КАРТ
          </h1>
          <p className="text-muted-foreground italic">Все доступные двери и сокровища в игре</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по названию..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="doors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12">
          <TabsTrigger value="doors" className="text-lg font-bold">Двери ({doors.length})</TabsTrigger>
          <TabsTrigger value="treasures" className="text-lg font-bold">Сокровища ({treasures.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="doors" className="mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filterCards(doors).map((card) => (
              <div key={card._id} onClick={() => setActiveCard(card)} className="cursor-pointer transition-transform hover:scale-105">
                <GameCard data={card} isCompact />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="treasures" className="mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filterCards(treasures).map((card) => (
              <div key={card._id} onClick={() => setActiveCard(card)} className="cursor-pointer transition-transform hover:scale-105">
                <GameCard data={card} isCompact />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* МОДАЛЬНОЕ ОКНО ПРОСМОТРА */}
      <Dialog open={!!activeCard} onOpenChange={(open) => !open && setActiveCard(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-[420px] p-0 bg-transparent border-none shadow-none flex justify-center items-center">
          {activeCard && (
            <div className="animate-in zoom-in-95 duration-200 p-2">
              <GameCard 
                data={activeCard} 
                className="w-full shadow-[0_0_50px_rgba(0,0,0,0.6)] rounded-2xl" 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}