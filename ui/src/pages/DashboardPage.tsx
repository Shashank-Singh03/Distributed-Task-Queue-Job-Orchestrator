import { useMetrics } from '../hooks/useMetrics'
import MetricsCards from '../components/metrics/MetricsCards'
import DlqSummary from '../components/metrics/DlqSummary'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import DashboardHero from '../components/dashboard/DashboardHero'
import { MotionFadeIn } from '../components/common/MotionFadeIn'

export default function DashboardPage() {
  const { data, loading, error, refetch } = useMetrics()

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  if (!data) {
    return <EmptyState message="No metrics data available" />
  }

  return (
    <div>
      <DashboardHero />
      <MotionFadeIn delay={0.1}>
        <div className="space-y-6">
          <MetricsCards jobCounts={data.job_counts} />
          <DlqSummary dlqDepth={data.dlq_depth} />
        </div>
      </MotionFadeIn>
    </div>
  )
}

