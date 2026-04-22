import React from 'react';
import { AudioLines, LoaderCircle, MonitorSpeaker, ShieldCheck, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { DISPLAY_CLASS } from '../utils/displayTheme';

interface AudioActivationScreenProps {
  onActivate: () => void;
  isActivating: boolean;
}

/**
 * Tela inicial exibida antes da ativação de áudio.
 * Requer interação do usuário para cumprir política de autoplay do browser.
 */
export const AudioActivationScreen: React.FC<AudioActivationScreenProps> = ({
  onActivate,
  isActivating,
}) => (
  <div className={DISPLAY_CLASS.pageCentered}>
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#FFFFFF_0%,#F4F6F8_48%,#EAF3FF_100%)]" />
    <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-[#DCE5EE] bg-white/95 p-6 text-center shadow-[0_30px_80px_rgba(0,27,61,0.10)] backdrop-blur-xl sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#BFEFE5] bg-[#E6F7F2] text-[#007A65] shadow-[0_16px_40px_rgba(0,187,148,0.14)]">
        <MonitorSpeaker className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-black uppercase text-[#00BB94]">Display operacional HealthCall</p>
      <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Bem-vindo à Tela de Chamadas</h1>
      <p className={`mx-auto mt-4 max-w-2xl text-lg font-semibold leading-relaxed ${DISPLAY_CLASS.textMuted}`}>
        Para garantir que os alertas sonoros funcionem, o navegador exige uma interação inicial.
      </p>

      <div className="my-8 grid gap-3 text-left sm:grid-cols-3">
        {[
          { label: 'Áudio de chamada', Icon: Volume2 },
          { label: 'Avisos do display', Icon: AudioLines },
          { label: 'Operação segura', Icon: ShieldCheck },
        ].map(({ label, Icon }) => (
          <div key={label} className="rounded-[1.25rem] border border-[#E5ECF3] bg-[#F8FAFC] p-4">
            <Icon className="h-5 w-5 text-[#00BB94]" aria-hidden="true" />
            <p className="mt-3 text-sm font-black text-[#001B3D]">{label}</p>
          </div>
        ))}
      </div>

      <Button
        onClick={onActivate}
        disabled={isActivating}
        size="lg"
        className="h-16 w-full rounded-full px-8 text-lg shadow-[0_18px_42px_rgba(0,187,148,0.22)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none sm:w-auto"
      >
        {isActivating ? (
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        )}
        {isActivating ? 'Ativando sistema de áudio...' : 'Ativar som e iniciar display'}
      </Button>
    </div>
  </div>
);
