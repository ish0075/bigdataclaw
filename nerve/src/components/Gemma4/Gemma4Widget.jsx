import React from 'react'

export default function Gemma4Widget({ isOpen, onToggle }) {
  if (!isOpen) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm">Gemma 4 Assistant</h4>
        <button onClick={onToggle} className="text-gray-400 hover:text-white">×</button>
      </div>
      <p className="text-xs text-gray-400">CEO assistant temporarily unavailable.</p>
    </div>
  )
}
