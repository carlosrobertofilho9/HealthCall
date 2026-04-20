import React from 'react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { Camera, User } from 'lucide-react';
import { SettingsGroup } from '@/features/settings/components/SettingsGroup';
import { cn } from '@/lib/utils';
import {
  updateUserProfile,
  uploadAvatar,
} from '@/features/settings/services/settingsService';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

type UserProfileSectionProps = {
  className?: string;
  destinations: string[];
  selectedDestination: string;
  onSelectedDestinationChange: (value: string) => void;
  destinationsLoading?: boolean;
};

export function UserProfileSection({
  className,
  destinations,
  selectedDestination,
  onSelectedDestinationChange,
  destinationsLoading = false,
}: UserProfileSectionProps) {
  const { profile, loading, setProfile } = useUserProfile();

  const [fullName, setFullName] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;

    setFullName(profile.full_name ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  React.useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreviewUrl(previewUrl);
  };

  const handleSaveProfile = async () => {
    if (!profile) {
      toast.error('Perfil do usuário não encontrado.');
      return;
    }

    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;

      if (avatarFile) {
        nextAvatarUrl = await uploadAvatar(profile.id, avatarFile);
      }

      const updatedProfile = await updateUserProfile(profile.id, {
        full_name: fullName.trim() || null,
        avatar_url: nextAvatarUrl || null,
        default_destination: selectedDestination || null,
      });

      if (updatedProfile) {
        setProfile(updatedProfile);
        setAvatarUrl(updatedProfile.avatar_url);
        setAvatarFile(null);
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
          setAvatarPreviewUrl(null);
        }
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const displayedAvatar = avatarPreviewUrl || avatarUrl;

  return (
    <SettingsGroup
      title="Perfil Profissional"
      description="Atualize sua identificação exibida no sistema."
      className={cn('w-full', className)}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="size-20 rounded-full border border-border bg-secondary/50 overflow-hidden flex items-center justify-center">
            {displayedAvatar ? (
              <img
                src={displayedAvatar}
                alt="Avatar do usuário"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="size-8 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar" className="text-sm font-semibold text-foreground/80">
              Foto de Perfil
            </Label>
            <Input
              id="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              icon={<Camera className="h-4 w-4" />}
              disabled={loading || saving}
            />
            <p className="text-[10px] text-muted-foreground italic">PNG, JPG ou WEBP até 5MB.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full-name" className="text-sm font-semibold text-foreground/80">
            Nome Completo
          </Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Digite seu nome completo"
            disabled={loading || saving}
            icon={null}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="default-destination" className="text-sm font-semibold text-foreground/80">
            Destino de Atendimento
          </Label>
          <Select
            onValueChange={onSelectedDestinationChange}
            value={selectedDestination}
            disabled={destinationsLoading || loading || saving}
          >
            <SelectTrigger id="default-destination" className="h-12 bg-background border-white/10">
              <SelectValue placeholder="Nenhum (selecionar ao adicionar)" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((destination) => (
                <SelectItem key={destination} value={destination}>
                  {destination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-[10px] text-muted-foreground italic">
            Este destino será pré-selecionado ao adicionar novos pacientes à fila.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={loading || saving}
            className="px-8 h-12 text-base shadow-lg shadow-primary/20"
          >
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>
      </div>
    </SettingsGroup>
  );
}
