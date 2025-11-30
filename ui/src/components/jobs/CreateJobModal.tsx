import { useState } from 'react'
import { createJob } from '../../api/jobs'
import Button from '../common/Button'
import Input from '../common/Input'
import { motion, AnimatePresence } from 'framer-motion'

type CreateJobModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateJobModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateJobModalProps) {
  const [taskType, setTaskType] = useState('')
  const [partitionKey, setPartitionKey] = useState('')
  const [payloadJson, setPayloadJson] = useState('{}')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate task type
    if (!taskType.trim()) {
      setError('Task type is required')
      return
    }

    // Validate JSON
    let parsedData: Record<string, unknown>
    try {
      parsedData = JSON.parse(payloadJson || '{}')
    } catch (err) {
      setError('Invalid JSON in payload field')
      return
    }

    setIsSubmitting(true)

    try {
      await createJob({
        payload: {
          task_type: taskType.trim(),
          data: parsedData,
        },
        partition_key: partitionKey.trim() || undefined,
      })

      // Success
      setTaskType('')
      setPartitionKey('')
      setPayloadJson('{}')
      onSuccess()
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create job'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Job
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Type <span className="text-red-500">*</span>
                </label>
                <Input
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  placeholder="e.g., echo, process_data"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partition Key (optional)
                </label>
                <Input
                  value={partitionKey}
                  onChange={(e) => setPartitionKey(e.target.value)}
                  placeholder="e.g., user-123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payload JSON <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={payloadJson}
                  onChange={(e) => setPayloadJson(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono text-sm"
                  placeholder='{"message": "Hello, World!"}'
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter valid JSON object
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Job'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

