import { JobStatus } from '../../api/types'
import Badge from '../common/Badge'

interface MetricsCardsProps {
  jobCounts: {
    PENDING: number
    RUNNING: number
    SUCCEEDED: number
    FAILED: number
    DEAD_LETTERED: number
    CANCELLED?: number
  }
}

export default function MetricsCards({ jobCounts }: MetricsCardsProps) {
  const cards = [
    {
      label: 'Pending',
      count: jobCounts.PENDING,
      status: JobStatus.PENDING,
      variant: 'info' as const,
    },
    {
      label: 'Running',
      count: jobCounts.RUNNING,
      status: JobStatus.RUNNING,
      variant: 'info' as const,
    },
    {
      label: 'Succeeded',
      count: jobCounts.SUCCEEDED,
      status: JobStatus.SUCCEEDED,
      variant: 'success' as const,
    },
    {
      label: 'Failed',
      count: jobCounts.FAILED,
      status: JobStatus.FAILED,
      variant: 'warning' as const,
    },
    {
      label: 'Dead Lettered',
      count: jobCounts.DEAD_LETTERED,
      status: JobStatus.DEAD_LETTERED,
      variant: 'danger' as const,
    },
  ]

  if (jobCounts.CANCELLED) {
    cards.push({
      label: 'Cancelled',
      count: jobCounts.CANCELLED,
      status: 'CANCELLED' as JobStatus,
      variant: 'info' as const,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.status}
          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Badge variant={card.variant}>{card.label}</Badge>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-semibold text-gray-900">
                {card.count.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

