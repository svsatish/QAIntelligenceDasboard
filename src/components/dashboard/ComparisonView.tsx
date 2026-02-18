import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ComparisonData } from '../../services/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

interface ComparisonViewProps {
  data: ComparisonData[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ data }) => {
  const { isDark } = useTheme();
  const { settings } = useSettings();
  const compactView = settings?.dashboard?.compactView ?? false;

  return (
    <div className={`bg-white dark:bg-gray-800 ${compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 ${compactView ? 'mb-4' : 'mb-8'} transition-colors duration-200`}>
      <h3 className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white ${compactView ? 'mb-2' : 'mb-4'}`}>Cycle Comparison</h3>
      <div className={compactView ? 'h-48 sm:h-64' : 'h-56 sm:h-80'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#374151' : '#eee'} />
            <XAxis type="number" stroke={isDark ? '#9CA3AF' : '#888'} />
            <YAxis
              dataKey="category"
              type="category"
              width={70}
              tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#666' }}
              stroke={isDark ? '#9CA3AF' : '#888'}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(55, 65, 81, 0.5)' : 'transparent' }}
              contentStyle={{
                backgroundColor: isDark ? '#1F2937' : '#fff',
                border: 'none',
                borderRadius: '8px',
                color: isDark ? '#F3F4F6' : '#111827'
              }}
            />
            <Legend wrapperStyle={{ color: isDark ? '#F3F4F6' : '#111827' }} />
            <Bar dataKey="current" fill="#3B82F6" name="Current Cycle" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar dataKey="previous" fill={isDark ? '#6B7280' : '#9CA3AF'} name="Previous Cycle" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonView;
