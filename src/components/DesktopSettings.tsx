import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useElectron } from '@/hooks/useElectron';
import { Monitor, Minimize2, Rocket, Bell } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Componente de configurações específicas do desktop (Electron)
 * Só exibe quando rodando no Electron
 */
export function DesktopSettings() {
  const {
    isElectron,
    alwaysOnTop,
    autoLaunchEnabled,
    setAlwaysOnTop,
    setAutoLaunch,
    sendNotification,
  } = useElectron();

  // Não renderizar se não estiver no Electron
  if (!isElectron) {
    return null;
  }

  const handleAlwaysOnTopChange = async (enabled: boolean) => {
    const success = await setAlwaysOnTop(enabled);
    if (success) {
      toast.success(
        enabled ? 'Janela sempre visível ativada' : 'Janela sempre visível desativada'
      );
    } else {
      toast.error('Erro ao alterar configuração');
    }
  };

  const handleAutoLaunchChange = async (enabled: boolean) => {
    const success = await setAutoLaunch(enabled);
    if (success) {
      toast.success(
        enabled
          ? 'HealthCall iniciará com o Windows'
          : 'Auto-start desativado'
      );
    } else {
      toast.error('Erro ao alterar auto-start');
    }
  };

  const testNotification = async () => {
    const success = await sendNotification(
      'Teste de Notificação',
      'Se você viu isso, as notificações estão funcionando! 🎉',
      { test: true }
    );

    if (success) {
      toast.success('Notificação enviada!');
    } else {
      toast.error('Erro ao enviar notificação');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Configurações Desktop
        </CardTitle>
        <CardDescription>
          Configurações específicas do aplicativo desktop Windows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Always on Top */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Janela sempre visível
            </Label>
            <p className="text-sm text-muted-foreground">
              Mantém a janela do HealthCall acima de todas as outras
            </p>
          </div>
          <Switch
            checked={alwaysOnTop}
            onCheckedChange={handleAlwaysOnTopChange}
          />
        </div>

        {/* Auto-launch */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Iniciar com Windows
            </Label>
            <p className="text-sm text-muted-foreground">
              HealthCall inicia automaticamente quando o Windows liga
            </p>
          </div>
          <Switch
            checked={autoLaunchEnabled}
            onCheckedChange={handleAutoLaunchChange}
          />
        </div>

        {/* Test Notification */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </Label>
          <p className="text-sm text-muted-foreground">
            Teste as notificações nativas do Windows
          </p>
          <Button onClick={testNotification} variant="outline" className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Testar Notificação
          </Button>
        </div>

        {/* Info */}
        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="font-medium mb-1">💡 Dica</p>
          <p className="text-muted-foreground">
            Fechar a janela minimiza o HealthCall para a bandeja do sistema.
            Para sair completamente, use o menu da bandeja.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
