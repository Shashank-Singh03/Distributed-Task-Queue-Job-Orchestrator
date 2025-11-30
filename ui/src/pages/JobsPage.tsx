import { useState } from 'react'
import { useJobs } from '../hooks/useJobs'
import { JobStatus } from '../api/types'
import JobFilters from '../components/jobs/JobFilters'
import JobsTable from '../components/jobs/JobsTable'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import Pagination from '../components/common/Pagination'
import Button from '../components/common/Button'
import CreateJobModal from '../components/jobs/CreateJobModal'
import { MotionFadeIn } from '../components/common/MotionFadeIn'

const ITEMS_PER_PAGE = 50

export default function JobsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<{
    status?: JobStatus
    jobId?: string
    partitionKey?: string
  }>({})
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { jobs, loading, error, refetch } = useJobs({
    limit: ITEMS_PER_PAGE * 10,
    offset: 0,
    status: filters.status,
  })

  // Filter jobs client-side
  const filteredJobs = jobs.filter((job) => {
    if (filters.jobId && !job.job_id.includes(filters.jobId)) {
      return false
    }
    if (filters.partitionKey && job.partition_key && !job.partition_key.includes(filters.partitionKey)) {
      return false
    }
    return true
  })

  const paginatedJobs = filteredJobs.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE))

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <ErrorState message={error} onRetry={refetch} />
  }

  return (
    <MotionFadeIn>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Jobs</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Create Job
        </Button>
      </div>

      <JobFilters onFilterChange={setFilters} />

      {filteredJobs.length === 0 ? (
        <EmptyState message="No jobs found" />
      ) : (
        <>
          <JobsTable jobs={paginatedJobs} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch()
          setIsCreateModalOpen(false)
        }}
      />
    </MotionFadeIn>
  )
}
