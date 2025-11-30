export default function Spinner() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" aria-hidden="true"></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

