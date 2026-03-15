import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils/constants';

const VoiceBilling = ({ onItemsDetected, products, isDisabled }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState({ online: false, checking: true });
  const [detectedItems, setDetectedItems] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const recognitionRef = useRef(null);

  // Check AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/voice/ai-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAiStatus({ ...data, checking: false });
    } catch (err) {
      setAiStatus({ online: false, checking: false, error: 'Cannot check AI status' });
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ta-IN'; // Tamil, can also try 'en-IN' for English-Indian

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setStatus(interimTranscript ? 'listening...' : 'ready');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error: ${event.error}`);
        setIsListening(false);
        setStatus('ready');
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Auto restart if still in listening mode
          try {
            recognitionRef.current.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };
    } else {
      setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus('ready');
    } else {
      setTranscript('');
      setError('');
      setDetectedItems([]);

      try {
        recognitionRef.current?.start();
        setIsListening(true);
        setStatus('listening...');
      } catch (e) {
        setError('Failed to start listening. Please try again.');
      }
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      setError('No speech detected. Please speak and try again.');
      return;
    }

    setStatus('processing...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/voice/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript: transcript.trim() })
      });

      const data = await response.json();

      if (data.success && data.items.length > 0) {
        setDetectedItems(data.items);
        setStatus('Items detected!');
      } else {
        setError('No matching products found. Try speaking more clearly.');
        setStatus('ready');
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process. Check if Ollama is running.');
      setStatus('ready');
    }
  };

  const addItemsToBill = () => {
    if (detectedItems.length > 0 && onItemsDetected) {
      onItemsDetected(detectedItems);
      setDetectedItems([]);
      setTranscript('');
      setStatus('ready');
    }
  };

  const clearAll = () => {
    setTranscript('');
    setDetectedItems([]);
    setError('');
    setStatus('ready');
  };

  const switchLanguage = (lang) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  };

  if (isDisabled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎤</span>
          <h3 className="font-semibold text-purple-800 dark:text-purple-200">Voice Billing</h3>
          {aiStatus.checking ? (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Checking AI...</span>
          ) : aiStatus.online ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">AI Ready</span>
          ) : (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Basic Mode</span>
          )}
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-purple-600 hover:text-purple-800 text-sm underline"
        >
          {showHelp ? 'Hide Help' : 'Help'}
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 text-sm">
          <p className="font-medium mb-2">How to use:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
            <li>Click the microphone button to start</li>
            <li>Speak product names with quantities</li>
            <li>Tamil: "Arisi rendu kg, sakkarai oru kg"</li>
            <li>English: "Rice 2 kg, Sugar 1 kg"</li>
            <li>Click Stop, then Process to detect items</li>
          </ul>
          <div className="mt-2 flex gap-2">
            <span className="text-xs">Language:</span>
            <button onClick={() => switchLanguage('ta-IN')} className="text-xs bg-purple-100 px-2 py-0.5 rounded hover:bg-purple-200">Tamil</button>
            <button onClick={() => switchLanguage('en-IN')} className="text-xs bg-purple-100 px-2 py-0.5 rounded hover:bg-purple-200">English</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={toggleListening}
          disabled={!!error && error.includes('not supported')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <>
              <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
              Stop
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2a1 1 0 002 0V7zm0 4a1 1 0 10-2 0v2a1 1 0 002 0v-2z" clipRule="evenodd" />
              </svg>
              Start
            </>
          )}
        </button>

        {transcript && !isListening && (
          <button
            onClick={processTranscript}
            disabled={status === 'processing...'}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {status === 'processing...' ? 'Processing...' : 'Process'}
          </button>
        )}

        {(transcript || detectedItems.length > 0) && (
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
          >
            Clear
          </button>
        )}

        <span className="text-sm text-purple-600 dark:text-purple-300 italic">
          {status}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
          {error}
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You said:</p>
          <p className="text-gray-800 dark:text-gray-200">{transcript}</p>
        </div>
      )}

      {/* Detected Items */}
      {detectedItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Detected Items:</p>
          <div className="space-y-2 mb-3">
            {detectedItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <span className="font-medium text-green-800 dark:text-green-200">{item.productName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.qty}</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">₹{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Total: ₹{detectedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </span>
            <button
              onClick={addItemsToBill}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Add to Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceBilling;
