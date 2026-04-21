import React, { useMemo, useState } from 'react';
import { BellRing, MessageCircle, PhoneCall, Printer, RefreshCcw, UserRoundCheck, UserRoundX } from 'lucide-react';
import { PageShell } from '@/components/layout';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@/components/ui';
import { printAppointmentReport } from '@/components/PatientQueue/printReportUtils';
import { printPatientList } from '@/components/PatientQueue/printUtils';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUserProfile } from '@/hooks/useUserProfile';
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

  const presenceSummary = useMemo(() => {
    const showedUp = todayAppointments.filter((appointment) => appointment.status === 'Compareceu').length;
    const noShow = todayAppointments.filter((appointment) => appointment.status === 'Faltou').length;
    const scheduled = todayAppointments.filter((appointment) => appointment.status === 'Agendado').length;

    return { showedUp, noShow, scheduled, total: todayAppointments.length };
  }, [todayAppointments]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendMessage(draftMessage, profile?.full_name ?? null);
    setDraftMessage('');
  };

  return (
    <PageShell className="p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/70 p-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Central de Recepção</h1>
            <p className="text-sm text-muted-foreground">
              Fluxo de pacientes, chat interno e chamada rápida em um único painel.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={goToToday}>Hoje</Button>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RefreshCcw className="size-4" /> Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={() => printPatientList(slots)}>
              <Printer className="size-4" /> Ficha do dia
            </Button>
            <Button size="sm" variant="outline" onClick={() => printAppointmentReport(slots)}>
              <Printer className="size-4" /> Relatório
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Data em foco</CardDescription>
              <CardTitle className="text-base">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge>{dayConfig.serviceLabel}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Lista de presença</CardDescription>
              <CardTitle className="text-2xl">{presenceSummary.total}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 pt-0 text-xs text-muted-foreground">
              <Badge variant="outline">Agendados: {presenceSummary.scheduled}</Badge>
              <Badge variant="outline">Compareceu: {presenceSummary.showedUp}</Badge>
              <Badge variant="outline">Faltou: {presenceSummary.noShow}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Fila de espera</CardDescription>
              <CardTitle className="text-2xl">{waitingQueue.length}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Próximo: <span className="font-semibold text-foreground">{nextInQueue?.patient_name ?? '—'}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Último chamado</CardDescription>
              <CardTitle className="text-base">{lastCall?.patientName ?? 'Nenhum chamado ainda'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button size="sm" onClick={callNextPatient}>
                <PhoneCall className="size-4" /> Chamar próximo
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gestão de fluxo de pacientes</CardTitle>
              <CardDescription>Marque comparecimento e faltas com atualização imediata.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
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
                      >
                        <UserRoundCheck className="size-4" /> Compareceu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'Faltou')}
                      >
                        <UserRoundX className="size-4" /> Faltou
                      </Button>
                    </div>
                  </div>
                ))}

                {!isLoading && todayAppointments.length === 0 && (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    Não há marcações para o dia selecionado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="size-5" /> Chat da recepção
              </CardTitle>
              <CardDescription>Canal interno em tempo real para comunicação rápida.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border p-3">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-lg bg-muted/50 p-2.5 text-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{message.sender_name || 'Equipe'}</span>
                      <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{message.content}</p>
                  </div>
                ))}

                {!isLoading && messages.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem hoje. Use o campo abaixo para iniciar.</p>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  placeholder="Digite uma mensagem para a recepção"
                />
                <Button type="submit" size="sm" disabled={isSending || !draftMessage.trim()}>
                  <BellRing className="size-4" /> Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
};

export default ReceptionPage;
