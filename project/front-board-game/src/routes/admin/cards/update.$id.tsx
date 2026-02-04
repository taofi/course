import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiCards } from '@/services/apiCards';
import { 
  CardUpdateForm, 
  type UpdateFormValues, 
  type TreasureUpdateValues, 
  type DoorUpdateValues 
} from '@/components/CardUpdateForm';
import { Loader2, Copy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/admin/cards/update/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<UpdateFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        try {
          const treasure = await apiCards.getTreasureById(id);
          setData({ ...treasure, mode: 'treasure' } as TreasureUpdateValues);
        } catch {
          const door = await apiCards.getDoorById(id);
          setData({ ...door, mode: 'door' } as DoorUpdateValues);
        }
      } catch (err) {
        toast.error("Карточка не найдена");
        navigate({ to: '/admin/cards' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Функция для перехода к созданию копии
  const handleCreateCopy = () => {
    if (!data) return;
    
    navigate({
      to: '/admin/cards/add',
      search: {
        type: data.mode,
        fromId: data._id, // Передаем ID текущей карты как шаблон
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Верхняя панель управления */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate({ to: '/admin/cards' })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold">Редактирование карточки</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleCreateCopy}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Создать копию
          </Button>
        </div>
      </div>

      <CardUpdateForm initialData={data} />
    </div>
  );
}