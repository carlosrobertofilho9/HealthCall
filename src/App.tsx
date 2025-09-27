import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './lib/supabaseClient';

/**
 * The main layout component for the application.
 * It includes the header, a main content area with nested routes (`Outlet`),
 * and the notification container. It also handles authentication state changes,
 * redirecting the user to the login page if they are not authenticated.
 */
const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        if (window.location.pathname === '/login') {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="relative flex size-full min-h-screen flex-col">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        aria-label="notificações"
      />
      <Header />
      <main className="flex-1 px-4 py-10 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default App;
