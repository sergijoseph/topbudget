import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './utils/queryClient'
import RootLayout from './pages/RootLayout'
import Home from './pages/Home'
import Signup, { action as signupAction } from './pages/Signup'
import Login, { action as loginAction } from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import GettingStarted, { action as gettingstartedAction } from './pages/GettingStarted'
import { rootLoader, authPagesLoader, gettingStartedLoader, dashboardLoader } from './utils/auth'
import { logout } from './utils/backend'
import Dashboard from './pages/Dashboard'
import NotVerified from './pages/NotVerified'
import VerifyAccount from './pages/VerifyAccount'
import AppCrash from './components/ui/AppCrash.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    id: 'root',
    loader: rootLoader,
    errorElement: <AppCrash />,
    hydrateFallbackElement: <></>,
    children: [
      {
        index: true,
        element: <Home />,
        loader: authPagesLoader
      },
      {
        path: 'login',
        element: <Login />,
        action: loginAction,
        loader: authPagesLoader
      },
      {
        path: 'signup',
        element: <Signup />,
        action: signupAction,
        loader: authPagesLoader
      },
      {
        path: 'gettingstarted',
        element: <GettingStarted />,
        loader: gettingStartedLoader,
        action: gettingstartedAction
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
        loader: dashboardLoader
      },
      {
        path: 'logout',
        action: logout
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />
      },
      {
        path: 'reset-password/:resetCode',
        element: <ResetPassword />
      },
      {
        path: 'not-verified',
        element: <NotVerified />
      },
      {
        path: 'verify-account/:verificationCode',
        element: <VerifyAccount />
      }
    ]
  }
])

function App() {

  return (


      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
  )
}

export default App
