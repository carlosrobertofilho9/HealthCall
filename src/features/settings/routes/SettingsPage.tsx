import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

export function SettingsPage() {
  const { userProfile, updateProfile, loading } = useUserProfile();
  const [clinicName, setClinicName] = React.useState(userProfile?.clinic_name || '');

  React.useEffect(() => {
    if (userProfile?.clinic_name) {
      setClinicName(userProfile.clinic_name);
    }
  }, [userProfile]);

  const handleSave = async () => {
    try {
      await updateProfile({ clinic_name: clinicName });
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
            <Label htmlFor="clinicName">Nome da Clínica</Label>
            <Input
              id="clinicName"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              placeholder="Ex: Clínica Saúde"
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