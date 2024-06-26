import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '~/styles/index.css';
import { MainPage } from '~/pages/Main';
import { RoomListPage } from './pages/RoomList';
import { GamePage } from './pages/Game';
import { RankingPage } from './pages/Ranking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGate } from './components/AuthGate';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainPage />,
  },
  {
    path: 'rooms',
    element: (
      <AuthGate>
        <RoomListPage />
      </AuthGate>
    ),
  },
  {
    path: 'game/:roomId',
    element: (
      <AuthGate>
        <GamePage />
      </AuthGate>
    ),
  },
  {
    path: 'ranking',
    element: <RankingPage />,
  },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
