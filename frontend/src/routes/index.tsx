import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { Landing } from '../pages/Landing/Landing'
import { Dashboard } from '../pages/Dashboard/Dashboard'
import { Roadmap } from '../pages/Roadmap/Roadmap'
import { Learn } from '../pages/Learn/Learn'
import { Playground } from '../pages/Playground/Playground'
import { Progress } from '../pages/Progress/Progress'
import { NotFound } from '../pages/NotFound/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'roadmap', element: <Roadmap /> },
      { path: 'learn', element: <Learn /> },
      { path: 'playground', element: <Playground /> },
      { path: 'progress', element: <Progress /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
