import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import CreateAlertPage from './pages/CreateAlertPage';
import UsersPage from './pages/UsersPage';
import MessagesPage from './pages/MessagesPage';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="alerts/create" element={<CreateAlertPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="messages" element={<MessagesPage />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;