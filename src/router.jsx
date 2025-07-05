import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import Signup from './components/Signup';
import Signin from './components/Signin';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicRoute>
        <App />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    ),
  },
  {
    path: '/signin',
    element: (
      <PublicRoute>
        <Signin />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
]);
