import { createFileRoute, Link } from '@tanstack/react-router'
import { 
  BookOpen, 
  Swords, 
  Layers, 
  Clock, 
  UserPlus,
  Zap,
  History as HistoryIcon, // Переименовываем, чтобы не было конфликта с типами браузера
  ExternalLink,
  Crown
} from 'lucide-react'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute('/rules/')({
  component: RulesComponent,
})

function RulesComponent() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl space-y-10">
      {/* HEADER */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black tracking-tighter lg:text-7xl flex items-center justify-center gap-4">
          <BookOpen className="h-12 w-12 lg:h-16 lg:w-16 text-primary" />
          ПРАВИЛА
        </h1>
        <p className="text-muted-foreground text-xl lg:text-2xl max-w-2xl mx-auto">
          Мочи монстров, хапай сокровища, подставляй друзей!
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link to="/cards">
              <Layers className="mr-2 h-5 w-5" />
              Список всех карточек
              <ExternalLink className="ml-2 h-4 w-4 opacity-50" />
            </Link>
          </Button>
        </div>
      </div>

      {/* WIN CONDITION SECTION */}
      <Card className="border-2 border-primary bg-primary/5 shadow-xl overflow-hidden">
        <CardHeader className="text-center bg-primary text-primary-foreground pb-8">
          <div className="mx-auto bg-background/20 p-3 rounded-full w-fit mb-4">
            <Crown className="h-10 w-10 text-yellow-400" />
          </div>
          <CardTitle className="text-3xl lg:text-4xl font-bold uppercase tracking-widest">
            Цель игры
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-2xl lg:text-3xl font-medium leading-relaxed">
            Победа настигает того, кто первым <span className="text-primary font-black underline underline-offset-8">получил 10-й уровень</span>!
          </p>
          <p className="mt-4 text-muted-foreground italic">
            Уровни можно получать за победу над монстрами или с помощью специальных карт сокровищ.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="decks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 items-stretch p-1 bg-muted rounded-xl">
          <TabsTrigger value="decks" className="text-lg font-bold">Колоды</TabsTrigger>
          <TabsTrigger value="battle" className="text-lg font-bold">Бой</TabsTrigger>
          <TabsTrigger value="inventory" className="text-lg font-bold">Ход</TabsTrigger>
        </TabsList>

        <TabsContent value="decks" className="mt-6">
          <div className="grid gap-6">
            <Card className="border-none shadow-md bg-card">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3 text-amber-600">
                  <Layers className="h-7 w-7" /> Колода Дверей
                </CardTitle>
                <CardDescription className="text-base">Что происходит, когда вы "выбиваете дверь":</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-5 items-start border-l-4 border-blue-500 pl-6 py-4 bg-secondary/30 rounded-r-xl">
                  <UserPlus className="h-8 w-8 text-blue-600 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-black text-xl mb-1">Раса или Класс</h4>
                    <p className="text-lg text-muted-foreground italic">
                      Заберите карту в руку. Ход немедленно переходит к следующему игроку.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5 items-start border-l-4 border-destructive pl-6 py-4 bg-destructive/5 rounded-r-xl">
                  <Swords className="h-8 w-8 text-destructive mt-1 shrink-0" />
                  <div>
                    <h4 className="font-black text-xl mb-1 text-destructive">Монстр</h4>
                    <p className="text-lg text-muted-foreground">
                      Вы обязаны вступить в бой. Если не победили — терпите Непотребство.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="battle" className="mt-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-6 space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="process" className="border-b-2">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline">Как работает бой?</AccordionTrigger>
                  <AccordionContent className="text-lg space-y-4 pt-2">
                    <p>Суммируйте ваш уровень и бонусы снаряжения. Если сумма <span className="text-primary font-bold">больше</span> силы монстра — вы победили.</p>
                    <div className="bg-primary/10 p-4 rounded-xl flex items-start gap-4 border border-primary/20">
                      <Zap className="h-6 w-6 text-primary shrink-0 mt-1" />
                      <p className="font-medium text-primary">
                        Любой игрок может использовать ОДНОРАЗОВЫЕ карты сокровищ (зелья и т.д.), чтобы помочь вам или усилить монстра!
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lose" className="border-b-2">
                  <AccordionTrigger className="text-xl font-bold text-destructive hover:no-underline">Поражение (Непотребство)</AccordionTrigger>
                  <AccordionContent className="text-lg space-y-2 text-muted-foreground">
                    <p>Если ваша сила меньше или равна силе монстра, он:</p>
                    <ul className="list-disc pl-8 space-y-2 py-2 font-medium">
                      <li>Крадет ваш уровень.</li>
                      <li>Забирает часть снаряжения (шлемы, броню и т.д.).</li>
                      <li>Может сделать что-то похуже, согласно описанию.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="win" className="border-none">
                  <AccordionTrigger className="text-xl font-bold text-green-600 hover:no-underline">Награда за победу</AccordionTrigger>
                  <AccordionContent className="text-lg">
                    <p className="mb-4 text-green-700 font-medium">Вы получаете уровень и тянете столько карт сокровищ, сколько указано на карте монстра.</p>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="text-sm px-4 py-1">Экипировка</Badge>
                      <Badge className="text-sm px-4 py-1">Одноразовые шмотки</Badge>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-medium">
            <Card className="border-2 border-muted">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" /> Только в свой ход
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg text-muted-foreground">
                <ul className="space-y-3 list-disc pl-5">
                  <li>Надевать и менять экипировку</li>
                  <li>Использовать карты "другого типа"</li>
                  <li>Выкидывать лишние карты (сброс)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-muted bg-muted/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <HistoryIcon className="h-6 w-6 text-primary" /> В любой момент
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg text-muted-foreground">
                <ul className="space-y-3 list-disc pl-5">
                  <li>Применять ОДНОРАЗОВЫЕ шмотки в любом бою</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <footer className="text-center py-12 border-t mt-10">
        <p className="text-muted-foreground text-sm opacity-60 italic">
          Помните: если возник спор по правилам — последнее слово за владельцем игры (админом).
        </p>
      </footer>
    </div>
  )
}