import { JobStatus } from '../../api/types'
import Badge from '../common/Badge'

interface JobStatusBadgeProps {
  status: JobStatus | string
}

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
    [JobStatus.PENDING]: { label: 'Pending', variant: 'info' },
    [JobStatus.RUNNING]: { label: 'Running', variant: 'info' },
    [JobStatus.SUCCEEDED]: { label: 'Succeeded', variant: 'success' },
    [JobStatus.FAILED]: { label: 'Failed', variant: 'warning' },
    [JobStatus.DEAD_LETTERED]: { label: 'Dead Lettered', variant: 'danger' },
    CANCELLED: { label: 'Cancelled', variant: 'default' },
  }

  const config = statusMap[status] || { label: status, variant: 'default' as const }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

