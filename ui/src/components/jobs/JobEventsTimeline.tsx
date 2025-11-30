import { useJobEvents } from '../../hooks/useJobEvents'
import Spinner from '../common/Spinner'
import ErrorState from '../common/ErrorState'

type JobEventsTimelineProps = {
  jobId: string
}

export default function JobEventsTimeline({ jobId }: JobEventsTimelineProps) {
  const { events, loading, error } = useJobEvents(jobId)

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No events recorded for this job
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Job Events Timeline</h3>
      <div className="border-l-2 border-gray-200 pl-4 space-y-4">
        {events.map((event, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-[18px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{event.event_type}</span>
                <span className="text-sm text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Status: <span className="font-medium">{event.status}</span>
              </div>
              {event.details && (
                <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                  {typeof event.details === 'string'
                    ? event.details
                    : JSON.stringify(event.details, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

