import React from 'react';
import { ActivityLog } from '../../services/mockData';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Image } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'failure': return <XCircle className="text-red-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={20} />;
      default: return <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full transition-colors duration-200">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Real-time Activity Feed</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {activities.map((log) => (
          <div key={log.id} className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div className="mt-1">{getIcon(log.status)}</div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{log.action}</h4>
                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{log.details}</p>

              <div className="flex gap-2 mt-2">
                <button className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  <ExternalLink size={12} />
                  View Logs
                </button>
                {log.screenshotUrl && (
                  <button className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                    <Image size={12} />
                    Screenshot
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
