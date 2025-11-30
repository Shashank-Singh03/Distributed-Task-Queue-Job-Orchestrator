import { useParams } from 'react-router-dom'
import { useJobDetail } from '../hooks/useJobDetail'
import JobDetailPanel from '../components/jobs/JobDetailPanel'
import JobEventsTimeline from '../components/jobs/JobEventsTimeline'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import { MotionFadeIn } from '../components/common/MotionFadeIn'
import { transitionJob } from '../api/jobs'
import { JobStatus } from '../api/types'
import Button from '../components/common/Button'
import { useState } from 'react'

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { job, loading, error, refetch } = useJobDetail(jobId || '')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleRetry = async () => {
    if (!jobId) return
    setIsTransitioning(true)
    try {
      await transitionJob(jobId, JobStatus.PENDING, 'Retry from UI')
      await refetch()
    } catch (err) {
      console.error('Failed to retry job:', err)
    } finally {
      setIsTransitioning(false)
    }
  }

  const handleRequeue = async () => {
    if (!jobId) return
    setIsTransitioning(true)
    try {
      await transitionJob(jobId, JobStatus.PENDING, 'Requeue from DLQ')
      await refetch()
    } catch (err) {
      console.error('Failed to requeue job:', err)
    } finally {
      setIsTransitioning(false)
    }
  }

  if (loading) {
    return <Spinner />
  }

  if (error || !job) {
    return <ErrorState message={error || 'Job not found'} onRetry={refetch} />
  }

  const canRetry = job.status === JobStatus.FAILED
  const canRequeue = job.status === JobStatus.DEAD_LETTERED

  return (
    <MotionFadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Job Details</h2>
          <div className="flex gap-2">
            {canRetry && (
              <Button onClick={handleRetry} disabled={isTransitioning}>
                {isTransitioning ? 'Retrying...' : 'Retry Job'}
              </Button>
            )}
            {canRequeue && (
              <Button onClick={handleRequeue} disabled={isTransitioning}>
                {isTransitioning ? 'Requeuing...' : 'Requeue from DLQ'}
              </Button>
            )}
          </div>
        </div>

        <JobDetailPanel job={job} />

        <div className="mt-8">
          <JobEventsTimeline jobId={job.job_id} />
        </div>
      </div>
    </MotionFadeIn>
  )
}
