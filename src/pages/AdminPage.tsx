import { Navbar } from '../components/layout/Navbar'
import { AdminDashboard } from '../components/admin/AdminDashboard'

export function AdminPage() {
  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <AdminDashboard />
    </div>
  )
}