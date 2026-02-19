import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, XCircle, SkipForward, AlertTriangle } from 'lucide-react';
import { ProjectData, Defect } from '../../services/mockData';
import { useSettings } from '../../context/SettingsContext';

interface TestDistributionChartProps {
  projects: ProjectData[];
  defects: Defect[];
}

const TestDistributionChart: React.FC<TestDistributionChartProps> = ({ projects, defects }) => {
  const { settings } = useSettings();
  const compactView = settings?.dashboard?.compactView ?? false;

  // Calculate overall test distribution
  const totalPassed = projects.reduce((acc, p) => acc + p.passed, 0);
  const totalFailed = projects.reduce((acc, p) => acc + p.failed, 0);
  const totalSkipped = projects.reduce((acc, p) => acc + p.skipped, 0);
  const totalNotExecuted = projects.reduce((acc, p) => acc + (p.totalTests - p.executed), 0);

  const testStatusData = [
    { name: 'Passed', value: totalPassed, color: '#22C55E', icon: CheckCircle },
    { name: 'Failed', value: totalFailed, color: '#EF4444', icon: XCircle },
    { name: 'Skipped', value: totalSkipped, color: '#9CA3AF', icon: SkipForward },
    { name: 'Not Run', value: totalNotExecuted, color: '#F59E0B', icon: AlertTriangle },
  ].filter(item => item.value > 0);

  // Calculate defect severity distribution
  const criticalDefects = defects.filter(d => d.severity === 'critical' && d.status !== 'closed').length;
  const majorDefects = defects.filter(d => d.severity === 'major' && d.status !== 'closed').length;
  const minorDefects = defects.filter(d => d.severity === 'minor' && d.status !== 'closed').length;
  const trivialDefects = defects.filter(d => d.severity === 'trivial' && d.status !== 'closed').length;

  const defectSeverityData = [
    { name: 'Critical', value: criticalDefects, color: '#DC2626' },
    { name: 'Major', value: majorDefects, color: '#F97316' },
    { name: 'Minor', value: minorDefects, color: '#FBBF24' },
    { name: 'Trivial', value: trivialDefects, color: '#9CA3AF' },
  ].filter(item => item.value > 0);

  // Calculate project health distribution
  const projectHealthData = projects.map(p => ({
    name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
    value: p.totalTests,
    color: p.passRate >= 95 ? '#22C55E' : p.passRate >= 85 ? '#FBBF24' : p.passRate >= 70 ? '#F97316' : '#EF4444',
    passRate: p.passRate,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Count: <span className="font-semibold">{data.value}</span>
          </p>
          {data.passRate !== undefined && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pass Rate: <span className="font-semibold">{data.passRate.toFixed(1)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalTests = projects.reduce((acc, p) => acc + p.totalTests, 0);
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';

  return (
    <div className={`bg-white dark:bg-gray-800 ${compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      <h3 className={`text-base sm:text-lg font-semibold text-gray-900 dark:text-white ${compactView ? 'mb-2' : 'mb-4'}`}>Test Distribution</h3>

      <div className={`${compactView ? 'h-48 sm:h-64' : 'h-56 sm:h-80'} flex flex-col`}>
        {/* Top section: Pie Chart and Stats side by side */}
        <div className="flex-1 flex gap-4">
          {/* Pie Chart */}
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 text-center">By Status</h4>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={testStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={55}
                    innerRadius={28}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {testStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {testStatusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="w-40 grid grid-cols-1 gap-2">
            <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg flex flex-col items-center justify-start">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{overallPassRate}%</div>
              <div className="text-xs text-green-700 dark:text-green-300">Pass Rate</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg flex flex-col items-center justify-start">
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {defects.filter(d => d.status === 'open').length}
              </div>
              <div className="text-xs text-red-700 dark:text-red-300">Open Defects</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg flex flex-col items-center justify-start">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalTests}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Total Tests</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg flex flex-col items-center justify-start">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{projects.length}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Projects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDistributionChart;

