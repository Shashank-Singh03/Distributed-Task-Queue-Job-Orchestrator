import { useNavigate } from 'react-router-dom'
import type { JobResponse } from '../../api/types'
import JobStatusBadge from './JobStatusBadge'

interface JobsTableProps {
  jobs: JobResponse[]
}

export default function JobsTable({ jobs }: JobsTableProps) {
  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleRowClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`)
  }

  if (jobs.length === 0) {
    return null
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attempts
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Partition Key
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated At
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr
              key={job.job_id}
              onClick={() => handleRowClick(job.job_id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRowClick(job.job_id)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View job ${job.job_id}`}
              className="hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                {job.job_id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {job.attempts}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {job.partition_key || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {job.payload.task_type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(job.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(job.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

