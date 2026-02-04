import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, type Control, useWatch } from "react-hook-form";
import {
  CardType, DoorType, CardRace, CardSize, CardClass, CardActionType,
  type ICardData, type IDoorData
} from '@munchkin/shared';
import { apiCards } from "@/services/apiCards";
import { getCardIcon } from "./CardIcon";
import { GameCard } from "./GameCard";

// UI Components (shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { API_BASE_URL } from "@/services/apiService";
import toast from "react-hot-toast";

type TreasureFormValues = Omit<ICardData, '_id'> & { mode: "treasure" };
type DoorFormValues = Omit<IDoorData, '_id'> & { mode: "door" };
type CardFormValues = TreasureFormValues | DoorFormValues;

interface CardFormProps {
  initialMode: 'door' | 'treasure';
  fromId?: string;
}

export function CardForm({ initialMode, fromId }: CardFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const createDefaultTreasure = (base = {}): TreasureFormValues => ({
    mode: "treasure",
    name: "",
    description: "",
    imageUrl: "",
    type: CardType.Other,
    price: 0,
    bonus: 0,
    action: [],
    ...base
  } as TreasureFormValues);

  const createDefaultDoor = (base = {}): DoorFormValues => ({
    mode: "door",
    name: "",
    description: "",
    imageUrl: "",
    type: DoorType.Monster,
    level: 0,
    treasure: 0,
    action: [],
    ...base
  } as DoorFormValues);

  const form = useForm<CardFormValues>({
    defaultValues: initialMode === 'door' ? createDefaultDoor() : createDefaultTreasure(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "action",
  });

  const watchedValues = useWatch({ control: form.control });
  const mode = (watchedValues.mode as 'door' | 'treasure') || initialMode;

  // Загрузка данных для копирования
  useEffect(() => {
    if (fromId) {
      const loadTemplate = async () => {
        try {
          setIsLoadingTemplate(true);
          const data = initialMode === 'treasure'
            ? await apiCards.getTreasureById(fromId)
            : await apiCards.getDoorById(fromId);

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _id, ...rest } = data;

          form.reset({
            ...rest,
            name: `${rest.name}`,
            mode: initialMode
          } as CardFormValues);

          toast.success("Данные скопированы");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Ошибка загрузки шаблона";
          toast.error(message);
        } finally {
          setIsLoadingTemplate(false);
        }
      };
      loadTemplate();
    }
  }, [fromId, initialMode, form]);

  // Смена режима (табы)
  useEffect(() => {
    if (!fromId) {
      const currentBase = {
        name: form.getValues("name"),
        description: form.getValues("description"),
        imageUrl: form.getValues("imageUrl"),
      };
      form.reset(initialMode === 'door' ? createDefaultDoor(currentBase) : createDefaultTreasure(currentBase));
    }
  }, [initialMode, fromId, form]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимальный размер: 3 МБ.");
      return;
    }
    try {
      setIsUploading(true);
      const imageUrl = await apiCards.uploadImage(file);
      form.setValue("imageUrl", imageUrl);
      toast.success("Изображение загружено");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка загрузки";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: CardFormValues) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mode: _, ...payload } = values;

      const filteredEntries = Object.entries(payload).filter(
        ([_, v]) => v !== "" && v !== undefined && v !== null
      );

      const cleanPayload = Object.fromEntries(filteredEntries) as unknown;

      if (values.mode === "treasure") {
        await apiCards.addTreasure(cleanPayload as ICardData);
      } else {
        await apiCards.addDoor(cleanPayload as IDoorData);
      }

      toast.success(`Карточка "${values.name}" создана.`);
      form.reset(values.mode === 'treasure' ? createDefaultTreasure() : createDefaultDoor());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка при сохранении";
      toast.error(message);
    }
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4 w-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Копирование данных...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-7xl mx-auto p-4">
      <Card className="flex-1 w-full border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {getCardIcon(watchedValues.type?.toString())}
            {fromId ? "Создание копии" : "Создание карты"}
          </CardTitle>
          <Tabs value={mode} onValueChange={(v) => {
            const current = {
              name: form.getValues("name"),
              description: form.getValues("description"),
              imageUrl: form.getValues("imageUrl")
            };
            form.reset(v === "treasure" ? createDefaultTreasure(current) : createDefaultDoor(current));
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="treasure">Сокровище</TabsTrigger>
              <TabsTrigger value="door">Дверь</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="px-0 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl><Input placeholder="Напр: Огромный чит" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl><Textarea className="min-h-[120px]" placeholder="Текст способности..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 bg-muted/20 min-h-[200px]">
                  {form.watch("imageUrl") ? (
                    <div className="relative group">
                      <img
                        src={`${API_BASE_URL}${form.watch("imageUrl")}`}
                        alt="Preview"
                        className="max-h-40 rounded shadow-md border bg-white"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => form.setValue("imageUrl", "")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer p-8 w-full">
                      {isUploading ? <Loader2 className="animate-spin text-primary" /> : <Upload className="h-10 w-10 text-muted-foreground" />}
                      <span className="text-sm font-medium">Загрузить арт</span>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-xl bg-card/50">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип {getCardIcon(field.value?.toString())}</FormLabel>
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
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Любая</SelectItem>
                        {Object.values(CardRace).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                

                {mode === "treasure" && (
                  <>
                    <FormField control={form.control} name="size" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Размер</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "none" ? undefined : val)}
                          value={field.value || "none"}
                        >
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">Обычный</SelectItem>
                            {Object.values(CardSize).map((s) => (
                              <SelectItem key={s} value={s}>
                                {s === CardSize.Big ? "Большой" : "Маленький"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bonus" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Бонус</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="price" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Цена</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </>
                )}

                {mode === "door" && (
                  <>
                    <FormField control={form.control} name="level" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Уровень</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="treasure" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сокровища</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )} />
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <Label className="text-md font-bold uppercase tracking-wider">Действия карты</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => append({ name: CardActionType.LevelUP, params: { count: 1 } })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Добавить
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border bg-muted/10 shadow-sm">
                    <FormField control={form.control} name={`action.${index}.name`} render={({ field: actionField }) => (
                      <FormItem className="flex-1 min-w-[150px]">
                        <Select onValueChange={(val: CardActionType) => {
                          actionField.onChange(val);
                          if (val === CardActionType.GiveBonus) {
                            form.setValue(`action.${index}.params`, { amount: 0, duration: "permanent" });
                          } else if (val === CardActionType.LevelUP || val === CardActionType.LevelDown) {
                            form.setValue(`action.${index}.params`, { count: 1 });
                          }
                        }} value={actionField.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(CardActionType).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <ActionParams index={index} control={form.control} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isUploading}>
                {isUploading ? <Loader2 className="animate-spin mr-2" /> : null}
                СОХРАНИТЬ В БАЗУ
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="w-full lg:w-[320px] lg:sticky lg:top-8 flex flex-col items-center gap-4">
        <Label className="text-muted-foreground uppercase text-xs font-black tracking-[0.2em]">Live Preview</Label>
        <div className="w-full flex justify-center p-6 bg-gradient-to-b from-muted/30 to-muted/10 rounded-3xl border-2 border-dashed border-muted-foreground/20">
          <GameCard data={watchedValues as ICardData | IDoorData} />
        </div>
      </div>
    </div>
  );
}

function ActionParams({ index, control }: { index: number; control: Control<CardFormValues> }) {
  const action = useWatch({ control, name: `action.${index}` });
  if (!action) return null;

  if (action.name === CardActionType.LevelUP || action.name === CardActionType.LevelDown) {
    return (
      <FormField control={control} name={`action.${index}.params.count`} render={({ field }) => (
        <FormItem className="w-24">
          <FormControl>
            <Input
              type="number"
              {...field}
              value={field.value ?? 1}
              onChange={e => field.onChange(Number(e.target.value))}
            />
          </FormControl>
        </FormItem>
      )} />
    );
  }

  if (action.name === CardActionType.GiveBonus) {
    return (
      <div className="flex gap-2">
        <FormField control={control} name={`action.${index}.params.amount`} render={({ field }) => (
          <FormItem className="w-20">
            <FormControl>
              <Input
                {...field}
                value={field.value ?? 0}
                onChange={e => {
                  const val = e.target.value;
                  field.onChange(isNaN(Number(val)) ? val : Number(val));
                }}
              />
            </FormControl>
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