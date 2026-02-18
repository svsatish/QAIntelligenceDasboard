import React, { useEffect, useState } from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface AlertSystemProps {
  hasCriticalErrors: boolean;
}

const AlertSystem: React.FC<AlertSystemProps> = ({ hasCriticalErrors }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasCriticalErrors) {
      setVisible(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [hasCriticalErrors]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-md w-full bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-up z-50 transition-colors duration-200">
      <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300">
        <AlertOctagon size={24} />
      </div>
      <div className="flex-1">
        <h4 className="text-red-800 dark:text-red-200 font-semibold">Critical Regression Detected</h4>
        <p className="text-red-600 dark:text-red-300 text-sm mt-1">
          Payment Gateway module failed 5 consecutive tests in Staging. Immediate attention required.
        </p>
        <div className="mt-3 flex gap-3">
          <button className="text-xs bg-red-600 dark:bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
            View Incident
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-xs text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 px-3 py-1.5"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-100"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default AlertSystem;
