'use client';

import { useState } from 'react';
import Papa from 'papaparse';

export default function FileUpload() {
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [modPrompt, setModPrompt] = useState('');
  const [modLoading, setModLoading] = useState(false);
  const [aiFindings, setAiFindings] = useState('');
  const [aiValidating, setAiValidating] = useState(false);
  const [fixing, setFixing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as string[][];
        setHeaders(parsed[0]);
        setData(parsed.slice(1));
        setErrors({});
        setAiFindings('');
      },
    });
  };

  const validateCell = (value: string, row: number, col: number, header: string) => {
    if (!value.trim()) return `Missing value in ${header}`;
    if (header === 'PriorityLevel') {
      const num = Number(value);
      if (isNaN(num) || num < 1 || num > 5) return 'PriorityLevel must be between 1 and 5';
    }
    if (header === 'AttributesJSON') {
      try {
        JSON.parse(value);
      } catch {
        return 'Invalid JSON';
      }
    }
    return '';
  };

  const handleCellChange = (value: string, rowIdx: number, colIdx: number) => {
    const updated = [...data];
    updated[rowIdx][colIdx] = value;
    setData(updated);

    const header = headers[colIdx];
    const error = validateCell(value, rowIdx, colIdx, header);

    setErrors((prev) => {
      const newErrors = { ...prev };
      const key = `${rowIdx}-${colIdx}`;
      if (error) newErrors[key] = error;
      else delete newErrors[key];
      return newErrors;
    });
  };

  const applyModification = async () => {
    if (!modPrompt) return;
    setModLoading(true);

    try {
      const res = await fetch('/api/modify-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, headers, prompt: modPrompt }),
      });

      const json = await res.json();
      if (json.success) {
        setHeaders(json.headers);
        setData(json.updatedData);
        setModPrompt('');
      } else {
        alert(json.error || 'Failed to apply modification.');
      }
    } catch {
      alert('Server error');
    } finally {
      setModLoading(false);
    }
  };

  const runAiValidator = async () => {
    setAiValidating(true);
    try {
      const res = await fetch('/api/validate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, data }),
      });
      const json = await res.json();
      if (json.success) setAiFindings(json.findings);
      else alert('Validation failed');
    } catch {
      alert('Server error');
    } finally {
      setAiValidating(false);
    }
  };

  const runAiFix = async () => {
    setFixing(true);
    try {
      const res = await fetch('/api/fix-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, data }),
      });
      const json = await res.json();
      if (json.success) {
        setHeaders(json.headers);
        setData(json.data);
        setErrors({});
        setAiFindings('');
      } else {
        alert(json.error || 'Failed to auto-fix data.');
      }
    } catch {
      alert('Server error.');
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="bg-white shadow-md p-6 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">📁 Upload CSV Data</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
      />

      {data.length > 0 && (
        <>
          <div className="overflow-auto max-h-[400px] border rounded">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-indigo-100 text-indigo-800 sticky top-0">
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className="p-2 border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rIdx) => (
                  <tr key={rIdx} className="even:bg-gray-50">
                    {row.map((cell, cIdx) => {
                      const key = `${rIdx}-${cIdx}`;
                      const isInvalid = !!errors[key];
                      return (
                        <td
                          key={cIdx}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            handleCellChange(e.currentTarget.textContent || '', rIdx, cIdx)
                          }
                          className={`p-2 border ${
                            isInvalid ? 'bg-red-50 border-red-500' : 'border-gray-300'
                          }`}
                          title={errors[key] || ''}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* NLP Data Modifier */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">🧠 Modify Data with Natural Language</h4>
            <textarea
              value={modPrompt}
              onChange={(e) => setModPrompt(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder='e.g. "Change all PriorityLevel 3 to 5"'
            />
            <button
              onClick={applyModification}
              disabled={modLoading}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {modLoading ? 'Applying...' : '✨ Apply Modification'}
            </button>
          </div>

          {/* AI Validator */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">🧪 AI Validator</h4>
            <button
              onClick={runAiValidator}
              disabled={aiValidating}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              {aiValidating ? 'Checking...' : '🧪 Run AI Validator'}
            </button>

            {aiFindings && (
              <div className="mt-4 bg-purple-50 border border-purple-300 text-purple-800 p-4 rounded text-sm whitespace-pre-wrap">
                <strong>AI Findings:</strong>
                <br />
                {aiFindings}
              </div>
            )}
          </div>

          {/* AI Auto-Fix */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">🛠 AI Auto-Fix</h4>
            <button
              onClick={runAiFix}
              disabled={fixing}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              {fixing ? 'Fixing...' : '🛠 Auto-Fix with AI'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
