import { Routes, Route } from 'react-router-dom'
import DashboardPage from '../pages/DashboardPage'
import JobsPage from '../pages/JobsPage'
import JobDetailPage from '../pages/JobDetailPage'
import DlqPage from '../pages/DlqPage'
import HealthPage from '../pages/HealthPage'

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:jobId" element={<JobDetailPage />} />
      <Route path="/dlq" element={<DlqPage />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  )
}

