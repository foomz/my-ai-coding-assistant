import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

export default function ImageMessage({ imageUrl, onOCRComplete }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [showOCR, setShowOCR] = useState(false);

  const processImage = async () => {
    if (isProcessing || ocrText) return;
    
    setIsProcessing(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();
      
      setOcrText(text);
      if (onOCRComplete) {
        onOCRComplete(text);
      }
    } catch (error) {
      console.error('OCR Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-2">
      <img
        src={imageUrl}
        alt="Uploaded content"
        className="max-w-full rounded-lg"
      />
      <div className="flex gap-2">
        <button
          onClick={processImage}
          disabled={isProcessing || ocrText}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : ocrText ? 'Processed' : 'Extract Text'}
        </button>
        {ocrText && (
          <button
            onClick={() => setShowOCR(!showOCR)}
            className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {showOCR ? 'Hide Text' : 'Show Text'}
          </button>
        )}
      </div>
      {showOCR && ocrText && (
        <div className="mt-2 p-3 bg-gray-800 rounded-lg">
          <pre className="text-sm text-gray-200 whitespace-pre-wrap">{ocrText}</pre>
        </div>
      )}
    </div>
  );
}