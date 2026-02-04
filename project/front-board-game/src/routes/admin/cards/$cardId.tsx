import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiCards } from '@/services/apiCards'
import toast from 'react-hot-toast'
import { CardForm } from '@/components/CardForm'

export const Route = createFileRoute('/admin/cards/$cardId')({
  component: EditCardPage,
})
export function EditCardPage() {
  const { cardId } = Route.useParams();
  const { type } = useSearch({ from: '/admin/cards/$cardId' }) as { type: 'door' | 'treasure' };
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = type === 'door' ? await apiCards.getDoorById(cardId) : await apiCards.getTreasureById(cardId);
        setFormData(data);
      } catch (err: any) {
        toast.error("Ошибка загрузки данных");
      }
    };
    load();
  }, [cardId, type]);

  const handleSubmit = async (updatedData: any) => {
    try {
      if (type === 'door') await apiCards.updateDoor(cardId, updatedData);
      else await apiCards.updateTreasure(cardId, updatedData);
      toast.success("Карточка обновлена");
      navigate({ to: '/admin/cards' });
    } catch (err: any) {
      toast.error(err.message || "Ошибка обновления");
    }
  };

  if (!formData) return <div className="p-10 text-center">Загрузка...</div>;

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Редактирование {type === 'door' ? 'двери' : 'сокровища'}</h1>
      <CardForm 
        initialData={formData} 
        type={type} 
        onSubmit={handleSubmit} 
        onCancel={() => navigate({ to: '/admin/cards' })}
        submitLabel="Сохранить изменения"
      />
    </div>
  );
}