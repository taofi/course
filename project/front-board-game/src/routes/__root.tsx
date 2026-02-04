// src/routes/__root.tsx (ОБНОВЛЕНО)

import { createRootRoute, Outlet } from '@tanstack/react-router';
import  { Toaster } from 'react-hot-toast';

import { Header } from '@/components/Header';
import { AppFooter } from '@/components/AppFooter';

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background flex flex-col font-body">
      <Toaster
        position="bottom-right"
        reverseOrder={false}
      />

      <Header />

      <main className="flex-grow p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  ),
});