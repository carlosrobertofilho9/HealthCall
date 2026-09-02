import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toaster } from '@/components/ui';
import type { Patient } from '@/types';
import { useLocalQueue } from '../useLocalQueue';
import { getStationSettings, type StationSettings } from '../stationSettings';
import { Activity, ArrowDown, ArrowUp, CheckCircle2, Clock3, Monitor, PhoneCall, Search, Settings, Trash2, UserRoundPlus, Users } from 'lucide-react';

function statusClasses(status: Patient['status']) {
  if (status === 'Chamado') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'Em Atendimento') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Atendimento Finalizado') return 'border-slate-200 bg-slate-100 text-slate-600';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

const LocalHomePage: React.FC = () => {
  const queue = useLocalQueue();
  const [name, setName] = useState('');
  const [station, setStation] = useState<StationSettings>(() => getStationSettings());
  const roomReady = Boolean(station.room.trim());

  useEffect(() => {
    const sync = () => setStation(getStationSettings());
    window.addEventListener('healthcall:station-settings', sync as EventListener);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('healthcall:station-settings', sync as EventListener);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const counts = useMemo(() => ({
    waiting: queue.patients.filter((p) => p.status === 'Aguardando').length,
    called: queue.patients.filter((p) => p.status === 'Chamado').length,
    serving: queue.patients.filter((p) => p.status === 'Em Atendimento').length,
    done: queue.patients.filter((p) => p.status === 'Atendimento Finalizado').length,
  }), [queue.patients]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const patient = await queue.addPatient(name);
    if (patient) setName('');
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#edf7f4_100%)] text-slate-900">
      <Toaster position="top-center" />
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">HC</span>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">HealthCall</h1>
                <p className="text-xs font-semibold text-slate-500">modo local · sem login</p>
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" to="/display" target="_blank">
              <Monitor className="size-4" /> Painel
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800" to="/settings">
              <Settings className="size-4" /> Configurar posto
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="rounded-3xl border border-white bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                  <span className={`size-2 rounded-full ${queue.connected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {queue.connected ? 'Servidor local conectado' : 'Servidor local indisponível'}
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Fila de atendimento</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
                  Qualquer computador da unidade pode adicionar ou chamar pacientes. A chamada aparece imediatamente no painel da recepção/TV.
                </p>
              </div>
              <div className={`min-w-48 rounded-2xl border p-4 ${roomReady ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Este posto</p>
                <p className="mt-1 text-xl font-black text-slate-950">{roomReady ? `Sala ${station.room}` : 'Sala não configurada'}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{station.role}{station.name ? ` · ${station.name}` : ''}</p>
              </div>
            </div>
            {!roomReady && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <span>Configure o número da sala antes da primeira chamada. Ele ficará salvo neste computador.</span>
                <Link className="rounded-xl bg-amber-900 px-3 py-2 font-bold text-white" to="/settings">Configurar agora</Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <Metric label="Aguardando" value={counts.waiting} icon={<Clock3 className="size-4" />} />
            <Metric label="Chamados" value={counts.called} icon={<PhoneCall className="size-4" />} />
            <Metric label="Em atendimento" value={counts.serving} icon={<Activity className="size-4" />} />
            <Metric label="Finalizados" value={counts.done} icon={<CheckCircle2 className="size-4" />} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <UserRoundPlus className="size-5 text-emerald-600" />
                <h3 className="font-extrabold">Adicionar à fila</h3>
              </div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500" htmlFor="patient-name">Nome do paciente</label>
              <input
                id="patient-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Maria da Silva"
                autoComplete="off"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
              />
              <button disabled={!name.trim()} className="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40" type="submit">
                Adicionar paciente
              </button>
              <button className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50" type="button" onClick={queue.addTicket}>
                Gerar próxima ficha
              </button>
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-extrabold">Operação</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">Os dados ficam no computador servidor da unidade.</p>
              <button
                type="button"
                disabled={!queue.patients.length}
                onClick={() => {
                  if (window.confirm('Limpar toda a fila e o histórico de chamadas?')) queue.clearQueue();
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 disabled:opacity-40"
              >
                <Trash2 className="size-4" /> Limpar fila do dia
              </button>
            </div>
          </aside>

          <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold">Pacientes</h3>
                <p className="text-sm font-medium text-slate-500">{queue.patients.length} registro(s) na fila</p>
              </div>
              <label className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input value={queue.search} onChange={(event) => queue.setSearch(event.target.value)} placeholder="Buscar paciente" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500" />
              </label>
            </div>

            {queue.loading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-500">Carregando fila...</div>
            ) : queue.filteredPatients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
                <Users className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 font-bold text-slate-700">Nenhum paciente na fila</p>
                <p className="mt-1 text-sm font-medium text-slate-500">Adicione um nome ou gere uma ficha para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.filteredPatients.map((patient) => {
                  const realIndex = queue.patients.findIndex((item) => item.id === patient.id);
                  return (
                    <article key={patient.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 xl:flex-row xl:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex min-w-8 justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">{realIndex + 1}</span>
                          <h4 className="truncate text-base font-extrabold text-slate-950">{patient.name}</h4>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${statusClasses(patient.status)}`}>{patient.status}</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {patient.callCount ? `${patient.callCount} chamada(s) · último destino: ${patient.destination}` : 'Ainda não chamado'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button title="Subir na fila" aria-label="Subir na fila" onClick={() => queue.move(realIndex, -1)} disabled={realIndex <= 0} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 disabled:opacity-25"><ArrowUp className="size-4" /></button>
                        <button title="Descer na fila" aria-label="Descer na fila" onClick={() => queue.move(realIndex, 1)} disabled={realIndex >= queue.patients.length - 1} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 disabled:opacity-25"><ArrowDown className="size-4" /></button>
                        <button onClick={() => queue.setStatus(patient, 'Em Atendimento')} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50">Atender</button>
                        <button onClick={() => queue.setStatus(patient, 'Atendimento Finalizado')} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50">Finalizar</button>
                        <button onClick={() => queue.removePatient(patient.id)} className="rounded-xl border border-rose-100 px-3 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50">Remover</button>
                        <button disabled={!roomReady} onClick={() => queue.callPatient(patient.id)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35">
                          <PhoneCall className="size-4" /> Chamar {roomReady ? `· Sala ${station.room}` : ''}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
};

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-slate-500">
        <span className="text-[10px] font-extrabold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

export default LocalHomePage;
