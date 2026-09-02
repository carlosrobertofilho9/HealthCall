import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '@/App';
import { HomePage } from '@/features/dashboard';
import SettingsPage from '@/features/settings/routes/SettingsPage';
import WarningsPage from '@/features/warnings/pages/WarningsPage';
import { AppointmentsPage, CapacityDashboardPage, WeeklyAppointmentsPage } from '@/features/appointments';
import DocumentsPage from '@/features/documents/pages/DocumentsPage';
import { PendenciasPage } from '@/features/pendencias';
import { WoundsPage, WoundEvolutionPage, WoundEvolutionTablePage } from '@/features/wounds';
import { ReceptionPage } from '@/features/reception';
import { PrescriptionsPage } from '@/features/prescriptions';
import LocalDisplayPage from '@/features/local/routes/LocalDisplayPage';
import LocalSettingsPage from '@/features/local/routes/LocalSettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'station', element: <LocalSettingsPage /> },
      { path: 'warnings', element: <WarningsPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'appointments/week', element: <WeeklyAppointmentsPage /> },
      { path: 'appointments/capacity', element: <CapacityDashboardPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'reception', element: <ReceptionPage /> },
      { path: 'pendencias', element: <PendenciasPage /> },
      { path: 'wounds', element: <WoundsPage /> },
      { path: 'wounds/evolution/:woundId', element: <WoundEvolutionPage /> },
      { path: 'wounds/table/:woundId', element: <WoundEvolutionTablePage /> },
      { path: 'prescriptions', element: <PrescriptionsPage /> },
    ],
  },
  { path: '/display', element: <LocalDisplayPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;
