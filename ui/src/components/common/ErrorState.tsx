import Button from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ message = 'An error occurred', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-600 mb-4">
        <svg
          className="w-12 h-12 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-gray-700 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>Retry</Button>
      )}
    </div>
  )
}

