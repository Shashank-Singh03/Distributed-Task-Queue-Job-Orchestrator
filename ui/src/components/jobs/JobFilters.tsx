import { useState } from 'react'
import { JobStatus } from '../../api/types'
import Input from '../common/Input'
import Select from '../common/Select'

interface JobFiltersProps {
  onFilterChange: (filters: {
    status?: JobStatus
    jobId?: string
    partitionKey?: string
  }) => void
}

export default function JobFilters({ onFilterChange }: JobFiltersProps) {
  const [status, setStatus] = useState<string>('')
  const [jobId, setJobId] = useState('')
  const [partitionKey, setPartitionKey] = useState('')

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onFilterChange({
      status: value ? (value as JobStatus) : undefined,
      jobId: jobId || undefined,
      partitionKey: partitionKey || undefined,
    })
  }

  const handleJobIdChange = (value: string) => {
    setJobId(value)
    onFilterChange({
      status: status ? (status as JobStatus) : undefined,
      jobId: value || undefined,
      partitionKey: partitionKey || undefined,
    })
  }

  const handlePartitionKeyChange = (value: string) => {
    setPartitionKey(value)
    onFilterChange({
      status: status ? (status as JobStatus) : undefined,
      jobId: jobId || undefined,
      partitionKey: value || undefined,
    })
  }

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: JobStatus.PENDING, label: 'Pending' },
    { value: JobStatus.RUNNING, label: 'Running' },
    { value: JobStatus.SUCCEEDED, label: 'Succeeded' },
    { value: JobStatus.FAILED, label: 'Failed' },
    { value: JobStatus.DEAD_LETTERED, label: 'Dead Lettered' },
  ]

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          label="Status"
          options={statusOptions}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
        />
        <Input
          label="Job ID"
          type="text"
          placeholder="Search by Job ID..."
          value={jobId}
          onChange={(e) => handleJobIdChange(e.target.value)}
        />
        <Input
          label="Partition Key"
          type="text"
          placeholder="Filter by partition key..."
          value={partitionKey}
          onChange={(e) => handlePartitionKeyChange(e.target.value)}
        />
      </div>
    </div>
  )
}

