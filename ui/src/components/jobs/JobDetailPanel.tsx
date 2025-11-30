import { JobResponse, JobStatus } from '../../api/types'
import JobStatusBadge from './JobStatusBadge'
import Button from '../common/Button'

interface JobDetailPanelProps {
  job: JobResponse
  onCancel: () => void
  cancelling: boolean
  cancelError?: string | null
}

export default function JobDetailPanel({
  job,
  onCancel,
  cancelling,
  cancelError,
}: JobDetailPanelProps) {
  const canCancel =
    job.status === JobStatus.PENDING || job.status === JobStatus.RUNNING

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatJSON = (obj: unknown) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Job Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Job ID: <span className="font-mono">{job.job_id}</span>
            </p>
          </div>
          <JobStatusBadge status={job.status} />
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <JobStatusBadge status={job.status} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Attempts</dt>
            <dd className="mt-1 text-sm text-gray-900">{job.attempts}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Partition Key</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {job.partition_key || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Task Type</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {job.payload.task_type}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(job.created_at)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Updated At</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDate(job.updated_at)}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <dt className="text-sm font-medium text-gray-500 mb-2">Payload</dt>
          <dd className="mt-1">
            <pre className="bg-gray-50 p-4 rounded-md border border-gray-200 overflow-x-auto text-xs font-mono">
              {formatJSON(job.payload)}
            </pre>
          </dd>
        </div>

        {job.result && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500 mb-2">Result</dt>
            <dd className="mt-1">
              <pre className="bg-green-50 p-4 rounded-md border border-green-200 overflow-x-auto text-xs font-mono">
                {formatJSON(job.result)}
              </pre>
            </dd>
          </div>
        )}

        {canCancel && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  Actions
                </h4>
                <p className="text-sm text-gray-500">
                  Cancel this job to prevent it from being processed
                </p>
              </div>
              <Button
                variant="danger"
                onClick={onCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Job'}
              </Button>
            </div>
            {cancelError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{cancelError}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

