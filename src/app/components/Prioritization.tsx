'use client';

import React, { useState } from 'react';

const templates = {
  'Maximize Fulfillment': { fulfillment: 80, cost: 10, speed: 10 },
  'Minimize Cost': { fulfillment: 20, cost: 70, speed: 10 },
  'Balanced': { fulfillment: 33, cost: 33, speed: 34 },
};

export default function Prioritization() {
  const [weights, setWeights] = useState({
    fulfillment: 40,
    cost: 30,
    speed: 30,
  });

  const applyTemplate = (template: keyof typeof templates) => {
    setWeights(templates[template]);
  };

  const handleChange = (key: string, value: number) => {
    const updated = { ...weights, [key]: value };
    const total = Object.values(updated).reduce((sum, v) => sum + v, 0);
    const normalized = Object.fromEntries(
      Object.entries(updated).map(([k, v]) => [k, Math.round((v / total) * 100)])
    );
    setWeights({
  fulfillment: normalized.fulfillment || 0,
  cost: normalized.cost || 0,
  speed: normalized.speed || 0,
});

  };

  const downloadPriorities = () => {
    const blob = new Blob([JSON.stringify(weights, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'priorities.json';
    a.click();
  };

  return (
    <div className="mt-10 p-6 border rounded-xl bg-white shadow-md max-w-2xl w-full">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">⚖️ Prioritization</h2>

      <div className="space-y-4">
        {Object.entries(weights).map(([key, value]) => (
          <div key={key}>
            <label className="block font-medium text-sm text-gray-700 capitalize mb-1">
              {key}: {value}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => handleChange(key, parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        ))}

        <div className="mt-4">
          <label className="block font-medium text-sm text-gray-700 mb-1">
            Preset Templates
          </label>
          <select
            onChange={(e) => applyTemplate(e.target.value as keyof typeof templates)}
            className="w-full border rounded p-2"
          >
            <option value="">-- select --</option>
            {Object.keys(templates).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <button
          onClick={downloadPriorities}
          className="mt-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ⬇️ Export priorities.json
        </button>
      </div>
    </div>
  );
}
