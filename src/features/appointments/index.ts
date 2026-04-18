// Feature: Appointments (Marcações PSF)
// Exporta os componentes principais da feature de marcações

export { default as AppointmentsPage } from './routes/AppointmentsPage';
export { default as QuickReceptionPage } from './routes/QuickReceptionPage';
export { default as WeeklyAppointmentsPage } from './routes/WeeklyAppointmentsPage';
export { default as CapacityDashboardPage } from './routes/CapacityDashboardPage';
export { useAppointments } from './hooks/useAppointments';
export * from './services/appointmentService';
