import { useHealth } from '../hooks/useHealth'
import Badge from '../components/common/Badge'
import Spinner from '../components/common/Spinner'
import ErrorState from '../components/common/ErrorState'

export default function HealthPage() {
  const { live, ready, loading, error } = useHealth()

  if (loading) {
    return <Spinner />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">System Health</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Liveness Probe
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Indicates if the API is running
                </p>
              </div>
              <Badge variant={live ? 'success' : 'danger'}>
                {live ? 'Live' : 'Down'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Readiness Probe
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Indicates if the API is ready to serve traffic
                </p>
              </div>
              <Badge variant={ready ? 'success' : 'danger'}>
                {ready ? 'Ready' : 'Not Ready'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Overall Status
        </h3>
        <p className="text-sm text-gray-600">
          {live && ready ? (
            <span className="text-green-600 font-medium">
              System is healthy and ready to serve traffic
            </span>
          ) : (
            <span className="text-red-600 font-medium">
              System is experiencing issues
            </span>
          )}
        </p>
      </div>
    </div>
  )
}


