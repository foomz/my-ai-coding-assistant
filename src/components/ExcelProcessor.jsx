import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function ExcelProcessor({ file, onProcessed }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const processExcel = async () => {
    if (!file || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Perform basic analysis without danfojs
      const analysis = {
        summary: {},
        columns: Object.keys(jsonData[0] || {}),
        rowCount: jsonData.length,
        columnCount: Object.keys(jsonData[0] || {}).length,
        preview: jsonData.slice(0, 5),
      };

      // Calculate statistics for numeric columns
      const columns = Object.keys(jsonData[0] || {});
      columns.forEach(col => {
        const values = jsonData.map(row => row[col]).filter(val => typeof val === 'number');
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          const mean = sum / values.length;
          const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
          
          analysis.summary[col] = {
            mean: mean,
            min: Math.min(...values),
            max: Math.max(...values),
            std: Math.sqrt(variance),
          };
        }
      });

      setAnalysis(analysis);
      if (onProcessed) {
        onProcessed(analysis);
      }

      toast.success('Excel file processed successfully');
    } catch (error) {
      console.error('Excel Processing Error:', error);
      toast.error('Error processing Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{file.name}</span>
        <button
          onClick={processExcel}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Analyze'}
        </button>
      </div>

      {analysis && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300">Rows</h3>
              <p className="text-xl text-white">{analysis.rowCount}</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300">Columns</h3>
              <p className="text-xl text-white">{analysis.columnCount}</p>
            </div>
          </div>

          {Object.keys(analysis.summary).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Numeric Columns Analysis</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Column</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Mean</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Min</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Max</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Std Dev</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {Object.entries(analysis.summary).map(([col, stats]) => (
                      <tr key={col}>
                        <td className="px-4 py-2 text-sm text-gray-300">{col}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{stats.mean.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{stats.min.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{stats.max.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-300">{stats.std.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-300">Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    {analysis.columns.map(col => (
                      <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-400">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {analysis.preview.map((row, i) => (
                    <tr key={i}>
                      {analysis.columns.map(col => (
                        <td key={col} className="px-4 py-2 text-sm text-gray-300">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}