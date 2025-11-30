import { Link } from 'react-router-dom'
import Button from '../common/Button'

interface DlqSummaryProps {
  dlqDepth: number
}

export default function DlqSummary({ dlqDepth }: DlqSummaryProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Dead Letter Queue
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Jobs that have exceeded maximum retry attempts
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-gray-900">
              {dlqDepth.toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-gray-500">jobs in DLQ</div>
          </div>
        </div>
        <div className="mt-5">
          <Link to="/dlq">
            <Button variant="secondary" className="w-full">
              View Dead Letter Queue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

