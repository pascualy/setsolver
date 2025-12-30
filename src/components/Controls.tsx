interface ControlsProps {
  isModelLoaded: boolean
  isRunning: boolean
  onToggleRunning: () => void
}

export function Controls({ isModelLoaded, isRunning, onToggleRunning }: ControlsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Controls</h2>
      
      <div className="space-y-4">
        {/* Start/Stop button */}
        <button
          onClick={onToggleRunning}
          disabled={!isModelLoaded}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            !isModelLoaded
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {!isModelLoaded ? 'Loading Models...' : isRunning ? 'Stop Detection' : 'Start Detection'}
        </button>
        
        {/* Model status */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-3 h-3 rounded-full ${isModelLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-gray-300">
            {isModelLoaded ? 'Models loaded' : 'Loading models...'}
          </span>
        </div>
        
        {/* Instructions */}
        <div className="text-sm text-gray-400 space-y-2">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Point camera at Set cards on a table</li>
            <li>Click "Start Detection"</li>
            <li>Valid sets will be highlighted</li>
            <li>Click a set in the list to highlight it</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
