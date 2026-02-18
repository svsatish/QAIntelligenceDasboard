import React from 'react';
import { ModuleError } from '../../services/mockData';

interface ModuleHeatmapProps {
  modules: ModuleError[];
}

const ModuleHeatmap: React.FC<ModuleHeatmapProps> = ({ modules }) => {
  const getColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 dark:bg-red-600 text-white';
      case 'high': return 'bg-orange-400 dark:bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-300 dark:bg-yellow-500 text-gray-800 dark:text-gray-900';
      case 'low': return 'bg-green-200 dark:bg-green-600 text-gray-800 dark:text-white';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Module Error Density</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {modules.map((module, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg flex flex-col items-center justify-center text-center transition-transform hover:scale-105 cursor-pointer ${getColor(module.severity)}`}
          >
            <span className="font-medium text-sm">{module.name}</span>
            <span className="text-2xl font-bold mt-2">{module.errorCount}</span>
            <span className="text-xs opacity-80 mt-1">Errors</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleHeatmap;
