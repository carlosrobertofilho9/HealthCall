import React from 'react';
import AppointmentsNav from '../components/AppointmentsNav';
import QuickAppointmentForm from '../components/QuickAppointmentForm';

const QuickReceptionPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <AppointmentsNav />

      <section className="rounded-2xl bg-[#122118] p-4 sm:p-6">
        <p className="text-sm font-semibold text-primary">Recepção rápida</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Marcação compacta</h2>
      </section>

      <QuickAppointmentForm />
    </div>
  );
};

export default QuickReceptionPage;
