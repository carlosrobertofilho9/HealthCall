import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Clock3, MessageCircle, PhoneCall, Printer, RefreshCcw, UserRoundCheck, UserRoundX, Users2 } from 'lucide-react';
import { PageShell } from '@/components/layout';
import { Badge, Button, Input, SectionCard } from '@/components/ui';
import { printAppointmentReport } from '@/components/PatientQueue/printReportUtils';
import { printPatientList } from '@/components/PatientQueue/printUtils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { useReception } from '../hooks/useReception';

const ReceptionPage: React.FC = () => {
  usePageTitle('Recepção');

  const {
    isLoading,
    slots,
    dayConfig,
    selectedDate,
    goToToday,
    refresh,
    updateStatus,
    todayAppointments,
    waitingQueue,
    nextInQueue,
    lastCall,
    callNextPatient,
    getSlotLabel,
    messages,
    sendMessage,
    isSending,
  } = useReception();

  const { profile } = useUserProfile();

  const [draftMessage, setDraftMessage] = useState('');
  const profileName = profile?.full_name?.trim() || 'Equipe de Recepção';
  const profileInitials = profileName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase() ?? '')
    .join('') || 'ER';

  const presenceSummary = useMemo(() => {
    const showedUp = todayAppointments.filter((appointment) => appointment.status === 'Compareceu').length;
    const noShow = todayAppointments.filter((appointment) => appointment.status === 'Faltou').length;
    const scheduled = todayAppointments.filter((appointment) => appointment.status === 'Agendado').length;

    return { showedUp, noShow, scheduled, total: todayAppointments.length };
  }, [todayAppointments]);

  const nextTwoPatients = waitingQueue.slice(0, 2);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendMessage(draftMessage, profile?.full_name ?? null);
    setDraftMessage('');
  };

  return (
    <PageShell className="p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4">
        <motion.div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm backdrop-blur-md"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight">Central de Recepção</h1>
            <p className="text-sm text-muted-foreground">
              Visualize o fluxo em três painéis: fila médica, operação e comunicação interna.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={goToToday} asChild>
              <motion.button whileTap={{ scale: 0.97 }}>Hoje</motion.button>
            </Button>
            <Button size="sm" variant="outline" onClick={refresh} asChild>
              <motion.button whileTap={{ scale: 0.97 }}>
              <RefreshCcw className="size-4" /> Atualizar
              </motion.button>
            </Button>
            <Button size="sm" variant="outline" onClick={() => printPatientList(slots)} asChild>
              <motion.button whileTap={{ scale: 0.97 }}>
              <Printer className="size-4" /> Ficha do dia
              </motion.button>
            </Button>
            <Button size="sm" variant="outline" onClick={() => printAppointmentReport(slots)} asChild>
              <motion.button whileTap={{ scale: 0.97 }}>
              <Printer className="size-4" /> Relatório
              </motion.button>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-[0.9fr,1.8fr,1.15fr]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
        >
          <SectionCard
            title="Painel da Chamada Médica"
            icon={<Clock3 className="size-5" />}
            className="rounded-2xl border border-border/60 bg-background/60 shadow-sm backdrop-blur-lg"
            headerClassName="border-border/60 px-4 py-3"
            contentClassName="p-4"
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Data em foco</p>
                <p className="font-semibold">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                })}
                </p>
                <Badge className="mt-2">{dayConfig.serviceLabel}</Badge>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Última pessoa chamada</p>
                <p className="mt-1 font-semibold">{lastCall?.patientName ?? 'Aguardando primeira chamada'}</p>
                <p className="text-xs text-muted-foreground">
                  {lastCall ? `Slot ${lastCall.slotNumber}` : 'Sem registro nesta sessão'}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Próximos 2 da lista médica</p>
                <div className="space-y-2">
                  {nextTwoPatients.map((patient, index) => (
                    <div key={patient.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                      <span className="truncate text-sm font-medium">{index + 1}. {patient.patient_name}</span>
                      <Badge variant="outline">{getSlotLabel(patient.slot_number)}</Badge>
                    </div>
                  ))}
                  {!isLoading && nextTwoPatients.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sem pacientes aguardando no momento.</p>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={callNextPatient} asChild>
                <motion.button whileTap={{ scale: 0.98 }}>
                  <PhoneCall className="size-4" /> Chamar médico para o próximo atendimento
                </motion.button>
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="Gestão de fluxo de pacientes"
            icon={<Users2 className="size-5" />}
            className="rounded-2xl border border-border/60 bg-background/60 shadow-sm backdrop-blur-lg"
            headerClassName="border-border/60 px-4 py-3"
            contentClassName="p-4"
          >
            <p className="mb-3 text-sm text-muted-foreground">Marque comparecimento e faltas com atualização imediata.</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Total no dia</p>
                <p className="text-2xl font-semibold">{presenceSummary.total}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Compareceu</p>
                <p className="text-2xl font-semibold text-emerald-600">{presenceSummary.showedUp}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Faltou</p>
                <p className="text-2xl font-semibold text-rose-600">{presenceSummary.noShow}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="space-y-2">
                {todayAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/80 p-3"
                  >
                    <div>
                      <p className="font-semibold">{appointment.patient_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Slot {appointment.slot_number} ({getSlotLabel(appointment.slot_number)}) • {appointment.document_type}: {appointment.document_value}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{appointment.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'Compareceu')}
                        asChild
                      >
                        <motion.button whileTap={{ scale: 0.97 }}>
                          <UserRoundCheck className="size-4" /> Compareceu
                        </motion.button>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'Faltou')}
                        asChild
                      >
                        <motion.button whileTap={{ scale: 0.97 }}>
                          <UserRoundX className="size-4" /> Faltou
                        </motion.button>
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {!isLoading && todayAppointments.length === 0 && (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Não há marcações para o dia selecionado.
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Chat interno"
            icon={<MessageCircle className="size-5" />}
            className="rounded-2xl border border-border/60 bg-background/60 shadow-sm backdrop-blur-lg"
            headerClassName="border-border/60 px-4 py-3"
            contentClassName="p-4"
          >
            <div className="flex h-full min-h-[520px] flex-col rounded-2xl border border-border/60 bg-background/70">
              <div className="flex items-center gap-3 border-b border-border/60 bg-muted/30 p-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={`Foto de ${profileName}`}
                    className="size-10 rounded-full border border-border/70 object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-primary/15 text-sm font-semibold text-primary">
                    {profileInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{profileName}</p>
                  <p className="text-xs text-muted-foreground">Canal estilo WhatsApp • Equipe online</p>
                </div>
              </div>

              <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'max-w-[90%] rounded-2xl border px-3 py-2.5 text-sm shadow-sm',
                      message.sender_name === profileName
                        ? 'ml-auto border-primary/30 bg-primary/10'
                        : 'mr-auto border-border/70 bg-muted/40'
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                      <span className="font-medium">{message.sender_name || 'Equipe'}</span>
                      <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{message.content}</p>
                  </motion.div>
                ))}

                {!isLoading && messages.length === 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
                    Nenhuma mensagem hoje. Use o campo abaixo para iniciar.
                  </motion.p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-border/60 bg-background/90 p-3">
                <Input
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Digite uma mensagem para a equipe"
                />
                <Button type="submit" size="sm" disabled={isSending || !draftMessage.trim()} asChild>
                  <motion.button whileTap={{ scale: 0.97 }}>
                    <BellRing className="size-4" /> Enviar
                  </motion.button>
                </Button>
              </form>
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </PageShell>
  );
};

export default ReceptionPage;
