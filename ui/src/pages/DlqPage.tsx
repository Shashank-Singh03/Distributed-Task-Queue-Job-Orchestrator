import { useDlqJobs } from '../hooks/useDlqJobs'
import JobsTable from '../components/jobs/JobsTable'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'

export default function DlqPage() {
  const { jobs, loading, error, refetch } = useDlqJobs()

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Dead Letter Queue
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Jobs that have exceeded maximum retry attempts and have been moved to the dead letter queue.
        </p>
      </div>
      {jobs.length === 0 ? (
        <EmptyState message="No jobs in dead letter queue" />
      ) : (
        <JobsTable jobs={jobs} />
      )}
    </div>
  )
}


