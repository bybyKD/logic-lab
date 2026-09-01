import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { LearningDashboard } from '../components/dashboard/LearningDashboard'

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <LearningDashboard />
      <Footer />
    </div>
  )
}