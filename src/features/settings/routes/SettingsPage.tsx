import React from 'react';
import { useSettings as useLocalSettings } from '@/features/settings/hooks/useSettings';
import { ThemeSelector } from '@/features/settings/components/ThemeSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Label,
  ActionBar,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card
} from '@/components/ui';
import { Palette, Settings as SettingsIcon } from 'lucide-react';

/**
 * A página de configurações da aplicação.
 *
 * Permite configurar: destino padrão, síntese de voz e tema visual.
 *
 * @returns {React.ReactElement} O componente da página de configurações.
 */
const SettingsPage: React.FC = () => {
  const {
    destinations,
    selected,
    setSelected,
    loading,
    saving,
    saveDefaultDestination,
  } = useLocalSettings();

  const [activeTab, setActiveTab] = React.useState('geral');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <header className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Configurações
        </h2>
        <p className="text-muted-foreground text-lg">
          Personalize sua experiência no HealthCall de acordo com sua rotina de trabalho.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 w-fit bg-secondary/50 p-1.5 border-none shadow-none">
          <TabsTrigger value="geral" className="px-6 py-2.5 data-[state=active]:shadow-lg transition-all duration-300">
            <SettingsIcon size={18} className="mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="px-6 py-2.5 data-[state=active]:shadow-lg transition-all duration-300">
            <Palette size={18} className="mr-2" />
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <div className="flex justify-center">
            {/* Fluxo de Trabalho */}
            <Card className="p-8 border-none shadow-xl bg-card backdrop-blur-sm w-full max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">
                    Fluxo de Trabalho
                  </h3>
                  <Label htmlFor="default-destination" className="text-sm font-semibold mb-3 block text-foreground/80">
                    Destino Padrão para Chamadas
                  </Label>
                  <Select onValueChange={setSelected} value={selected} disabled={loading}>
                    <SelectTrigger id="default-destination" className="h-12 bg-background border-white/10">
                      <SelectValue placeholder="Nenhum (selecionar ao adicionar)" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-3 text-[10px] text-muted-foreground italic">
                    Este destino será pré-selecionado ao adicionar novos pacientes à fila.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <ActionBar className="justify-end p-4 bg-secondary/10 rounded-2xl border border-white/5 backdrop-blur-md max-w-2xl mx-auto">
            <Button
              onClick={saveDefaultDestination}
              disabled={saving || loading}
              className="px-8 h-12 text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Salvando...
                </span>
              ) : 'Aplicar Alterações'}
            </Button>
          </ActionBar>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <Card className="p-8 border-none shadow-2xl bg-linear-to-br from-card/80 to-card/40 backdrop-blur-md">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Palette size={18} />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Identidade Visual
                  </h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Escolha a atmosfera que melhor se adapta ao seu ambiente de trabalho.
                  Oferecemos temas otimizados para redução da fadiga ocular.
                </p>
              </div>
              
              <ThemeSelector />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
