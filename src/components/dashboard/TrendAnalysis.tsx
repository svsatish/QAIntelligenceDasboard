import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TestTrend } from '../../services/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

interface TrendAnalysisProps {
  data: TestTrend[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ data }) => {
  const { isDark } = useTheme();
  const { settings } = useSettings();
  const compactView = settings?.dashboard?.compactView ?? false;

  return (
    <div className={`bg-white dark:bg-gray-800 ${compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      <h3 className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white ${compactView ? 'mb-2' : 'mb-4'}`}>Failure Trends</h3>
      <div className={compactView ? 'h-48 sm:h-64' : 'h-56 sm:h-80'}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#eee'} />
            <XAxis dataKey="date" stroke={isDark ? '#9CA3AF' : '#888'} />
            <YAxis stroke={isDark ? '#9CA3AF' : '#888'} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                backgroundColor: isDark ? '#1F2937' : '#fff',
                color: isDark ? '#F3F4F6' : '#111827'
              }}
            />
            <Legend wrapperStyle={{ color: isDark ? '#F3F4F6' : '#111827' }} />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="#10B981"
              strokeWidth={2}
              name="Pass Rate (%)"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="failRate"
              stroke="#EF4444"
              strokeWidth={2}
              name="Fail Rate (%)"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendAnalysis;
