'use client';

import React, { useState, ChangeEvent } from 'react';

interface Rule {
  type: string;
  target1: string;
  target2?: string;
}

interface RuleBuilderProps {
  data: string[][];
  headers: string[];
}

export default function RuleBuilder({ data, headers }: RuleBuilderProps) {
  const ruleTypes = ['co-run', 'not-co-run', 'phase-window', 'slot-requirement'];

  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleType, setRuleType] = useState('');
  const [target1, setTarget1] = useState('');
  const [target2, setTarget2] = useState('');
  const [nlpPrompt, setNlpPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const addRule = () => {
    if (!ruleType || !target1) return;

    const newRule: Rule = { type: ruleType, target1 };
    if (target2 && (ruleType === 'co-run' || ruleType === 'not-co-run')) {
      newRule.target2 = target2;
    }

    setRules([...rules, newRule]);
    setRuleType('');
    setTarget1('');
    setTarget2('');
  };

  const convertToRule = async () => {
    try {
      const res = await fetch('/api/convert-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: nlpPrompt }),
      });

      const json = await res.json();
      if (json.success) {
        setRules((prev) => [...prev, ...json.rules]);
        setNlpPrompt('');
      } else {
        alert(json.error || 'Failed to convert rule');
      }
    } catch {
      alert('Server error during rule conversion');
    }
  };

  const handleRecommendRules = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/recommend-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, data }),
      });

      const json = await res.json();
      if (json.success) {
        setAiSuggestions(json.suggestions);
      } else {
        alert(json.error || 'Failed to get AI suggestions');
      }
    } catch {
      alert('Server error while fetching recommendations');
    }
    setLoadingSuggestions(false);
  };

  return (
    <div className="mt-10 bg-white p-6 border rounded shadow-sm">
      <h2 className="text-xl font-semibold text-indigo-700 mb-4">🛠 Rule Builder</h2>

      <div className="flex gap-3 flex-wrap items-center mb-4">
        <select
          className="p-2 border rounded"
          value={ruleType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setRuleType(e.target.value)}
        >
          <option value="">Select Rule Type</option>
          {ruleTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Target 1"
          value={target1}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTarget1(e.target.value)}
          className="p-2 border rounded"
        />

        {(ruleType === 'co-run' || ruleType === 'not-co-run') && (
          <input
            type="text"
            placeholder="Target 2"
            value={target2}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTarget2(e.target.value)}
            className="p-2 border rounded"
          />
        )}

        <button
          onClick={addRule}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          ➕ Add Rule
        </button>
      </div>

      {rules.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2">📜 Current Rules</h4>
          <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
            {rules.map((rule, idx) => (
              <li key={idx}>
                {rule.type} → {rule.target1}
                {rule.target2 && ` & ${rule.target2}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <h4 className="font-semibold mb-2">💬 Natural Language to Rule</h4>
        <textarea
          value={nlpPrompt}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNlpPrompt(e.target.value)}
          placeholder="e.g. Tasks T1 and T2 must not run together"
          className="w-full p-2 border rounded mb-2 text-sm"
        />
        <button
          onClick={convertToRule}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          ✨ Convert to Rule
        </button>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">🧠 AI Rule Recommendations</h4>
        <button
          onClick={handleRecommendRules}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          {loadingSuggestions ? 'Loading...' : '🧠 Recommend Rules'}
        </button>

        {aiSuggestions && (
          <div className="mt-3 bg-orange-50 text-orange-800 border border-orange-300 p-4 rounded text-sm whitespace-pre-wrap">
            {aiSuggestions}
          </div>
        )}
      </div>
    </div>
  );
}
