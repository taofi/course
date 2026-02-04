import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { adminApi } from '@/services/apiAdmin';
import { UserCacheService } from '@/services/UserCacheService';
import { GameCard } from '@/components/GameCard';
import { UserAvatar } from '@/components/UserAvatar';
import {
  type ICardData,
  type IDoorData,
  type IFullGameSnapshot
} from '@munchkin/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ArrowLeft, RefreshCcw, Swords, Shield,
  Zap, Scroll, ChevronRight, Users,
  Layers, RotateCcw, PlayCircle
} from 'lucide-react';

export const Route = createFileRoute('/admin/games/$gameId')({
  component: GameDetailComponent,
});

function GameDetailComponent() {
  const { gameId } = Route.useParams();
  const [snapshot, setSnapshot] = useState<IFullGameSnapshot | null>(null);
  const [playersData, setPlayersData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  // Состояние для модального окна просмотра карты
  const [activeCard, setActiveCard] = useState<ICardData | IDoorData | null>(null);

  const userCache = UserCacheService.getInstance();

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.games.getSnapshot(gameId);
      if (!data) return;
      setSnapshot(data);

      if (!selectedPlayerId) setSelectedPlayerId(data.game.participantsId[0]);

      const userDetailsMap: Record<string, any> = {};
      await Promise.all(
        data.game.participantsId.map(async (id: string) => {
          const details = await userCache.getById(id);
          userDetailsMap[id] = details;
        })
      );
      setPlayersData(userDetailsMap);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, [gameId]);

  if (isLoading || !snapshot) return <div className="p-10 text-center animate-pulse">Синхронизация с Redis...</div>;

  const selectedStats = selectedPlayerId ? snapshot.playersStats[selectedPlayerId] : null;
  const selectedInfo = selectedPlayerId ? playersData[selectedPlayerId] : null;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" asChild><Link to="/admin/games"><ArrowLeft className="mr-2 h-4" /> Назад</Link></Button>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="font-mono">{gameId}</Badge>
          <Button size="sm" onClick={loadAllData}><RefreshCcw className="mr-2 h-4" /> Обновить</Button>
        </div>
      </div>

      {/* GAME GLOBAL STATE SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <PlayCircle className="text-primary h-8 w-8" />
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Текущая фаза</p>
              <p className="font-bold text-lg">{snapshot.game.phase}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 col-span-3">
          <DeckInfoCard
            title="Колода Дверей"
            count={snapshot.game.doorsLeftCount || 0}
            discard={snapshot.decks.discardDoors.length}
            icon={<Layers className="h-4 w-4" />}
          />
          <DeckInfoCard
            title="Колода Сокровищ"
            count={snapshot.game.treasureLeftCount || 0}
            discard={snapshot.decks.discardTreasures.length}
            icon={<Layers className="h-4 w-4 text-yellow-500" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Players List */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Игроки</h2>
          {snapshot.game.participantsId.map((pId) => {
            const isSelected = selectedPlayerId === pId;
            const isCurrent = pId === snapshot.game.currentPlayerId;
            const stats = snapshot.playersStats[pId];
            const info = playersData[pId];

            return (
              <Card
                key={pId}
                className={`cursor-pointer transition-all hover:bg-muted/50 ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
                onClick={() => setSelectedPlayerId(pId)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar username={info?.username || '...'} imageUrl={info?.avatar} className="h-10 w-10" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{info?.username || '...'}</span>
                        {isCurrent && <Badge className="bg-green-500 text-[9px] h-4">ХОД</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">Ур: {stats?.level} | Сила: {stats?.power || stats?.level}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${isSelected ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* RIGHT COLUMN: Player Detail Statistics */}
        <div className="col-span-12 lg:col-span-8">
          {selectedStats && (
            <Card className="min-h-[600px] shadow-lg">
              <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar username={selectedInfo?.username} imageUrl={selectedInfo?.avatar} className="h-14 w-14" />
                  <div>
                    <CardTitle className="text-2xl">{selectedInfo?.username}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">Раунд {snapshot.game.round}</Badge>
                      <Badge variant="secondary">Активность: {selectedStats.activity}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">

                {/* Equipment Section */}
                <section>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /> Экипировка</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <EquipSlot label="Голова" item={selectedStats.headGear} onCardClick={setActiveCard} />
                    <EquipSlot label="Броня" item={selectedStats.armor} onCardClick={setActiveCard} />
                    <EquipSlot label="Обувь" item={selectedStats.boots} onCardClick={setActiveCard} />
                    <EquipSlot label="Лев. рука" item={selectedStats.oneHand} onCardClick={setActiveCard} />
                    <EquipSlot label="Прав. рука" item={selectedStats.secondHand} onCardClick={setActiveCard} />
                  </div>
                </section>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Stats & Bonuses */}
                  <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" /> Характеристики</h3>
                    <div className="space-y-3">
                      <StatRow label="Раса" value={selectedStats.race?.name || 'Человек'} />
                      <StatRow label="Ловкость" value={selectedStats.agility} />
                      <div className="space-y-2 mt-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Постоянные бонусы</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedStats.permanentBonus.map((b, i) => (
                            <Badge key={i} variant="secondary" className="cursor-help" onClick={() => setActiveCard(b)}>
                              {b.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Hand Cards */}
                  <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Scroll className="h-5 w-5 text-purple-500" /> В руке ({selectedStats.cardsCount})</h3>
                    <ScrollArea className="h-[250px] border rounded-lg p-4 bg-muted/5">
                      <div className="grid grid-cols-2 gap-3">
                        {selectedStats.cards.map((card) => (
                          <div key={card._id} onClick={() => setActiveCard(card)} className="cursor-zoom-in">
                            <GameCard data={card} isCompact variant="icon" className="scale-90 origin-top-left hover:brightness-110" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </section>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* CARD DETAIL MODAL */}
      {/* CARD DETAIL MODAL */}
      <Dialog open={!!activeCard} onOpenChange={(open) => !open && setActiveCard(null)}>
        <DialogContent className="max-w-[320px] md:max-w-[420px] p-0 bg-transparent border-none shadow-none flex justify-center items-center overflow-visible">
          {activeCard && (
            <div className="relative animate-in zoom-in-95 duration-200">
              {/* Убираем лишние масштабы, так как размер теперь контролируется DialogContent */}
              <GameCard
                data={activeCard}
                className="w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl"
              />

              {/* Кнопка закрытия для удобства (опционально, так как Dialog дает свою) */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 rounded-full opacity-70 hover:opacity-100"
                onClick={() => setActiveCard(null)}
              >
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DeckInfoCard({ title, count, discard, icon }: { title: string, count: number, discard: number, icon: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Колода</p>
            <p className="font-bold">{count}</p>
          </div>
          <div className="text-center border-l pl-4">
            <p className="text-[10px] text-muted-foreground uppercase">Сброс</p>
            <p className="font-bold text-red-500">{discard}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function EquipSlot({ label, item, onCardClick }: { label: string; item?: any, onCardClick: (c: any) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
      {item ? (
        <div onClick={() => onCardClick(item)} className="cursor-zoom-in w-full transition-transform hover:scale-105">
          <GameCard data={item} className="w-full" />
        </div>
      ) : (
        <div className="w-full aspect-[2/3] border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 text-muted-foreground/40">
          <RotateCcw className="h-4 w-4 mb-1" />
          <span className="text-[8px] uppercase">Пусто</span>
        </div>
      )}
    </div>
  );
}