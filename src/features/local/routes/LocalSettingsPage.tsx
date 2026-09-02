import React, { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toaster } from '@/components/ui';
import { localApi } from '../localApi';
import {
  getDisplayPreferences,
  getStationSettings,
  saveDisplayPreferences,
  saveStationSettings,
  STATION_ROLES,
  type LocalDisplayPreferences,
  type StationSettings,
} from '../stationSettings';
import { ArrowLeft, Monitor, Save, Server, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

const LocalSettingsPage: React.FC = () => {
  const [station, setStation] = useState<StationSettings>(() => getStationSettings());
  const [display, setDisplay] = useState<LocalDisplayPreferences>(() => getDisplayPreferences());
  const [globalNotices, setGlobalNotices] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    localApi.getSettings().then((settings) => setGlobalNotices(settings.noticesEnabled)).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!station.room.trim()) {
      toast.error('Informe o número ou nome da sala.');
      return;
    }
    setSaving(true);
    try {
      saveStationSettings(station);
      saveDisplayPreferences(display);
      await localApi.updateSettings({ noticesEnabled: globalNotices });
      toast.success('Configuração salva neste posto.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar as configurações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-center" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Voltar"><ArrowLeft className="size-5" /></Link>
            <div>
              <h1 className="text-xl font-black">Configuração do posto</h1>
              <p className="text-xs font-semibold text-slate-500">fica preservada neste navegador</p>
            </div>
          </div>
          <Link to="/display" target="_blank" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"><Monitor className="size-4" /> Abrir painel</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Server className="size-5" /></div>
              <div>
                <h2 className="font-black">Identificação deste computador</h2>
                <p className="text-sm font-medium text-slate-500">Não é uma conta. Serve apenas para saber de qual sala saiu a chamada.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Sala *</span>
                <input value={station.room} onChange={(event) => setStation((current) => ({ ...current, room: event.target.value }))} placeholder="Ex.: 03 ou Consultório 2" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Perfil</span>
                <select value={station.role} onChange={(event) => setStation((current) => ({ ...current, role: event.target.value as StationSettings['role'] }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500">
                  {STATION_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Nome do profissional (opcional)</span>
                <input value={station.name} onChange={(event) => setStation((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Dra. Ana" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-500" />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><Volume2 className="size-5" /></div>
              <div>
                <h2 className="font-black">Painel e áudio</h2>
                <p className="text-sm font-medium text-slate-500">Som e voz são locais ao dispositivo. Avisos institucionais podem ser desligados para toda a unidade.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
              <ToggleRow label="Som da chamada neste dispositivo" description="Emite um sinal antes de anunciar o paciente." checked={display.soundEnabled} onChange={(checked) => setDisplay((current) => ({ ...current, soundEnabled: checked }))} />
              <ToggleRow label="Voz da chamada neste dispositivo" description="Usa a voz do próprio navegador, sem API externa." checked={display.voiceEnabled} onChange={(checked) => setDisplay((current) => ({ ...current, voiceEnabled: checked }))} />
              <ToggleRow label="Avisos institucionais neste dispositivo" description="Oculta a faixa de avisos do painel local." checked={display.noticesEnabled} onChange={(checked) => setDisplay((current) => ({ ...current, noticesEnabled: checked }))} />
              <ToggleRow label="Avisos institucionais da unidade" description="Desliga os avisos em todos os painéis conectados a este servidor." checked={globalNotices} onChange={setGlobalNotices} />
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Sem login e sem Supabase: a configuração do posto fica local; fila e histórico ficam no SQLite do servidor.</p>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50" type="submit"><Save className="size-4" /> {saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </main>
    </div>
  );
};

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 p-4">
      <span>
        <span className="block text-sm font-extrabold text-slate-800">{label}</span>
        <span className="mt-1 block text-xs font-medium text-slate-500">{description}</span>
      </span>
      <input type="checkbox" className="size-5 accent-emerald-600" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default LocalSettingsPage;
