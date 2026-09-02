import React from 'react';
import { useSettings as useLocalSettings } from '@/features/settings/hooks/useSettings';
import { ThemeSelector } from '@/features/settings/components/ThemeSelector';
import { SettingsGroup } from '@/features/settings/components/SettingsGroup';
import { UserProfileSection } from '@/features/settings/components/UserProfileSection';
import { NetworkStatusSection } from '@/features/settings/components/NetworkStatusSection';
import { PageShell } from '@/components/layout';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui';
import { Network, Palette, UserCircle2 } from 'lucide-react';

/**
 * A página de configurações da aplicação.
 *
 * Permite configurar: perfil, rede local e tema visual.
 *
 * @returns {React.ReactElement} O componente da página de configurações.
 */
const SettingsPage: React.FC = () => {
  const {
    destinations,
    selected,
    setSelected,
    loading,
  } = useLocalSettings();

  const [activeTab, setActiveTab] = React.useState('perfil');

  return (
    <PageShell className="p-4 lg:p-6">
      <div className="min-w-0 space-y-6">
        <header className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Configurações
          </h2>
          <p className="text-muted-foreground text-lg">
            Personalize sua experiência no HealthCall de acordo com sua rotina de trabalho.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 w-full min-w-0 border-none bg-secondary/50 p-1.5 shadow-none sm:w-fit">
            <TabsTrigger value="perfil" className="min-w-0 flex-1 px-4 py-2.5 transition-all duration-300 data-[state=active]:shadow-lg sm:flex-none sm:px-6">
              <UserCircle2 size={18} className="mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="rede" className="min-w-0 flex-1 px-4 py-2.5 transition-all duration-300 data-[state=active]:shadow-lg sm:flex-none sm:px-6">
              <Network size={18} className="mr-2" />
              Rede
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="min-w-0 flex-1 px-4 py-2.5 transition-all duration-300 data-[state=active]:shadow-lg sm:flex-none sm:px-6">
              <Palette size={18} className="mr-2" />
              Aparência
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UserProfileSection
              className="max-w-3xl mx-auto"
              destinations={destinations}
              selectedDestination={selected}
              onSelectedDestinationChange={setSelected}
              destinationsLoading={loading}
            />
          </TabsContent>

          <TabsContent value="rede" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <NetworkStatusSection />
          </TabsContent>

          <TabsContent value="aparencia" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SettingsGroup
              title="Identidade Visual"
              description="Escolha a atmosfera que melhor se adapta ao seu ambiente de trabalho. Oferecemos temas otimizados para redução da fadiga ocular."
              className="w-full max-w-3xl mx-auto bg-linear-to-br from-card/80 to-card/40 shadow-2xl"
            >
              <div className="space-y-8">
                <ThemeSelector />
              </div>
            </SettingsGroup>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

export default SettingsPage;
