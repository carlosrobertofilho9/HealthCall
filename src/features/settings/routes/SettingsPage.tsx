import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

export function SettingsPage() {
  const { profile, setDefaultDestination, loading } = useUserProfile();
  const [destination, setDestination] = React.useState(profile?.default_destination || '');

  React.useEffect(() => {
    if (profile?.default_destination) {
      setDestination(profile.default_destination);
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await setDefaultDestination(destination);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Geral</CardTitle>
          <CardDescription>Configurações gerais da aplicação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Destino Padrão (Ex: Consultório 1)</Label>
            <Input
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Consultório 1"
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;