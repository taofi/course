import React, { useState } from "react";
import { useForm, useFieldArray, type Control, useWatch } from "react-hook-form";
import {
  CardType, DoorType, CardRace, CardSize, CardClass, CardActionType,
  type ICardData, type IDoorData, 
} from '@munchkin/shared';
import { apiCards } from "@/services/apiCards";
import { getCardIcon } from "./CardIcon";
import { GameCard } from "./GameCard";

// UI Components (shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Upload, X, Save, ArrowLeft } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

import { API_BASE_URL } from "@/services/apiService";
import { useNavigate } from "@tanstack/react-router";
import toast from "react-hot-toast";

// Строгая типизация значений формы
export type TreasureUpdateValues = ICardData & { mode: "treasure" };
export type DoorUpdateValues = IDoorData & { mode: "door" };
export type UpdateFormValues = TreasureUpdateValues | DoorUpdateValues;

interface CardUpdateFormProps {
  initialData: UpdateFormValues;
}

export function CardUpdateForm({ initialData }: CardUpdateFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<UpdateFormValues>({
    defaultValues: initialData,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "action",
  });

  const watchedValues = useWatch({ control: form.control });
  const mode = initialData.mode;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const imageUrl = await apiCards.uploadImage(file);
      form.setValue("imageUrl", imageUrl);
      toast.success("Изображение загружено");
    } catch (error: any) {
      toast.error(error?.error?.message || "Ошибка загрузки");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsPending(true);
      if (mode === "treasure") await apiCards.deleteTreasure(initialData._id);
      else await apiCards.deleteDoor(initialData._id);
      toast.success("Карточка успешно удалена");
      navigate({ to: "/admin/cards" });
    } catch (error: any) {
      toast.error("Ошибка при удалении карточки");
    } finally {
      setIsPending(false);
    }
  };

  const onSubmit = async (values: UpdateFormValues) => {
    try {
      setIsPending(true);

      const changes: Partial<UpdateFormValues> = {};
      
      (Object.keys(values) as Array<keyof UpdateFormValues>).forEach((key) => {
        if (key === 'mode' || key === '_id') return;
        if (JSON.stringify(values[key]) !== JSON.stringify(initialData[key])) {
          // @ts-ignore
          changes[key] = values[key];
        }
      });

      if (Object.keys(changes).length === 0) {
        toast.error("Вы не внесли никаких изменений");
        return;
      }

      if (values.mode === "treasure") {
        await apiCards.updateTreasure(initialData._id, changes as Partial<ICardData>);
      } else {
        await apiCards.updateDoor(initialData._id, changes as Partial<IDoorData>);
      }

      toast.success("Данные обновлены");
      navigate({ to: "/admin/cards" });
    } catch (error: any) {
      toast.error(error?.error?.message || "Ошибка обновления");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-7xl mx-auto p-4">
      <Card className="flex-1 w-full border-none shadow-none bg-transparent">
        <CardHeader className="px-0 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {getCardIcon(watchedValues.type?.toString())} Редактирование
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/cards' })}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Назад
            </Button>

            {/* Замена window.confirm на AlertDialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isPending}>
                  <Trash2 className="h-4 w-4 mr-1" /> Удалить
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие необратимо. Карточка "{initialData.name}" будет навсегда удалена из базы данных.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="px-0 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="name" rules={{ required: "Обязательно" }} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" rules={{ required: "Обязательно" }} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание *</FormLabel>
                      <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-muted/20 min-h-[200px]">
                  {watchedValues.imageUrl ? (
                    <div className="relative group">
                      <img src={`${API_BASE_URL}${watchedValues.imageUrl}`} alt="Preview" className="max-h-40 rounded shadow-md border bg-white" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => form.setValue("imageUrl", "")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer p-8">
                      {isUploading ? <Loader2 className="animate-spin text-primary" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
                      <span className="text-sm font-medium">Загрузить арт</span>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-card/50">
                {/* ... (остальные поля Select и Input остаются без изменений) ... */}
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mode === "treasure"
                          ? Object.values(CardType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                          : Object.values(DoorType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <FormField control={form.control} name="race" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Раса</FormLabel>
                    <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Любая</SelectItem>
                        {Object.values(CardRace).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                {mode === "treasure" ? (
                  <>
                    <FormField control={form.control} name="class" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Класс</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={(field.value as string) || "none"}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">Любой</SelectItem>
                            {Object.values(CardClass).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="size" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Размер</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === "none" ? undefined : v)} value={(watchedValues as TreasureUpdateValues).size || "none"}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">Обычный</SelectItem>
                            {Object.values(CardSize).map(s => <SelectItem key={s} value={s}>{s === CardSize.Big ? "Большой" : "Маленький"}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="price" rules={{ required: "Обязательно", min: 0 }} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цена *</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bonus" render={({ field }) => (
                      <FormItem><FormLabel>Бонус</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                  </>
                ) : (
                  <>
                    <FormField control={form.control} name="level" render={({ field }) => (
                      <FormItem><FormLabel>Уровень</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="treasure" render={({ field }) => (
                      <FormItem><FormLabel>Сокровища</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
                    )} />
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <Label className="text-md font-bold uppercase tracking-wider">Действия</Label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => append({ name: CardActionType.LevelUP, params: { count: 1 } })}>
                    <Plus className="h-4 w-4 mr-1" /> Добавить
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border bg-muted/10">
                    <FormField control={form.control} name={`action.${index}.name`} render={({ field }) => (
                      <FormItem className="flex-1 min-w-[150px]">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(CardActionType).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <ActionParams index={index} control={form.control} />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isPending || isUploading}>
                {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                ОБНОВИТЬ
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="w-full lg:w-[320px] lg:sticky lg:top-8">
        <GameCard data={watchedValues as any} />
      </div>
    </div>
  );
}

// Вспомогательный компонент параметров действий (ActionParams) остается без изменений
function ActionParams({ index, control }: { index: number; control: Control<UpdateFormValues> }) {
  const action = useWatch({ control, name: `action.${index}` });
  if (!action) return null;

  if (action.name === CardActionType.LevelUP || action.name === CardActionType.LevelDown) {
    return (
      <FormField control={control} name={`action.${index}.params.count`} render={({ field }) => (
        <FormItem className="w-24">
          <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
        </FormItem>
      )} />
    );
  }

  if (action.name === CardActionType.GiveBonus) {
    return (
      <div className="flex gap-2">
        <FormField control={control} name={`action.${index}.params.amount`} render={({ field }) => (
          <FormItem className="w-20">
            <FormControl><Input {...field} value={field.value ?? ""} onChange={e => field.onChange(isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))} /></FormControl>
          </FormItem>
        )} />
        <FormField control={control} name={`action.${index}.params.duration`} render={({ field }) => (
          <FormItem className="w-28">
            <Select onValueChange={field.onChange} value={field.value as string}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="permanent">Пост.</SelectItem>
                <SelectItem value="temporary">Врем.</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>
    );
  }
  return null;
}