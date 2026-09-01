import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { ModulePage } from './pages/ModulePage'
import { ChallengePage } from './pages/ChallengePage'
import { ChallengesIndexPage } from './pages/ChallengesIndexPage'
import { AdminPage } from './pages/AdminPage'
import { AnimatedCursor } from './components/ui/AnimatedCursor'

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedCursor />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/module/:id" element={<ModulePage />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
        <Route path="/challenges" element={<ChallengesIndexPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}