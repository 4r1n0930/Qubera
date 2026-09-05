import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { LoginPage } from '../pages/LoginPage'
import { Home } from '../pages/Home/Home'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { Learn } from '../pages/Learn/Learn'
import { QuantumLab } from '../pages/QuantumLab/QuantumLab'
import { CodeEditor } from '../pages/CodeEditor/CodeEditor'
import { Games } from '../pages/Games/Games'
import { Challenges } from '../pages/Challenges/Challenges'
import { Progress } from '../pages/Progress/Progress'
import { QuantumLabPage } from '../pages/QuantumLab/QuantumLabPage'
import { Leaderboard } from '../pages/Leaderboard/Leaderboard'
import { AITutor } from '../pages/AITutor/AITutor'
import { Resources } from '../pages/Resources/Resources'
import { Profile } from '../pages/Profile/Profile'
import { SettingsPage } from '../pages/Settings/SettingsPage'
import { Contact } from '../pages/Contact/Contact'
import { NotFound } from '../pages/NotFound/NotFound'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'learn', element: <Learn /> },
      { path: 'lab', element: <QuantumLabPage /> },
      { path: 'progress', element: <Progress /> },
      { path: 'login', element: <LoginPage /> },
      { path: '*', element: <NotFound /> },
      { path: 'quantum-lab', element: <QuantumLab /> },
      { path: 'code-editor', element: <CodeEditor /> },
      { path: 'contact', element: <Contact /> },
    ],
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'learn', element: <Learn /> },
      { path: 'quantum-lab', element: <QuantumLabPage /> },
      { path: 'code-editor', element: <CodeEditor /> },
      { path: 'games', element: <Games /> },
      { path: 'challenges', element: <Challenges /> },
      { path: 'progress', element: <Progress /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'ai-tutor', element: <AITutor /> },
      { path: 'resources', element: <Resources /> },
      { path: 'profile', element: <Profile /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
