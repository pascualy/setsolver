import type { ProcessedResult } from '../types'

interface StatsProps {
  fps: number
  results: ProcessedResult | null
}

export function Stats({ fps, results }: StatsProps) {
  return (
    <div className="flex gap-4 mt-2 text-sm">
      <div className="bg-gray-800 rounded px-3 py-1">
        <span className="text-gray-400">FPS: </span>
        <span className={fps > 20 ? 'text-green-400' : fps > 10 ? 'text-yellow-400' : 'text-red-400'}>
          {fps}
        </span>
      </div>
      
      <div className="bg-gray-800 rounded px-3 py-1">
        <span className="text-gray-400">Cards: </span>
        <span className="text-white">{results?.cards.length ?? 0}</span>
      </div>
      
      <div className="bg-gray-800 rounded px-3 py-1">
        <span className="text-gray-400">Sets: </span>
        <span className="text-white">{results?.sets.length ?? 0}</span>
      </div>
      
      {results?.inferenceTime && (
        <div className="bg-gray-800 rounded px-3 py-1">
          <span className="text-gray-400">Inference: </span>
          <span className="text-white">{results.inferenceTime.toFixed(1)}ms</span>
        </div>
      )}
    </div>
  )
}
