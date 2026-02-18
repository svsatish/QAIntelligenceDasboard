import React from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TestSuite } from '../../services/mockData';
import { format, isToday } from 'date-fns';

interface StatsOverviewProps {
  suites: TestSuite[];
  selectedDate: Date;
  comparisonSuites: TestSuite[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ suites, selectedDate, comparisonSuites }) => {
  // Today's stats (current data)
  const totalTests = suites.reduce((acc, s) => acc + s.total, 0);
  const passedTests = suites.reduce((acc, s) => acc + s.passed, 0);
  const failedTests = suites.reduce((acc, s) => acc + s.failed, 0);
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100) : 0;
  const avgDuration = suites.length > 0 ? (suites.reduce((acc, s) => acc + s.duration, 0) / suites.length) : 0;

  // Selected date stats (comparison data)
  const compTotalTests = comparisonSuites.reduce((acc, s) => acc + s.total, 0);
  const compPassedTests = comparisonSuites.reduce((acc, s) => acc + s.passed, 0);
  const compFailedTests = comparisonSuites.reduce((acc, s) => acc + s.failed, 0);
  const compPassRate = compTotalTests > 0 ? ((compPassedTests / compTotalTests) * 100) : 0;
  const compAvgDuration = comparisonSuites.length > 0 ? (comparisonSuites.reduce((acc, s) => acc + s.duration, 0) / comparisonSuites.length) : 0;

  const getComparisonLabel = () => {
    if (isToday(selectedDate)) return '';
    return `vs ${format(selectedDate, 'MMM dd')}`;
  };

  const getTrendInfo = (current: number, comparison: number, isLowerBetter: boolean = false) => {
    const diff = current - comparison;
    const percentChange = comparison !== 0 ? ((diff / comparison) * 100).toFixed(1) : '0';

    // If comparing to today (same date), show as stable
    if (isToday(selectedDate)) {
      return { trend: 'Current', icon: Minus, positive: true };
    }

    if (Math.abs(parseFloat(percentChange)) < 0.5) {
      return { trend: `Stable ${getComparisonLabel()}`, icon: Minus, positive: true };
    }

    const isPositive = isLowerBetter ? diff < 0 : diff > 0;
    const sign = parseFloat(percentChange) > 0 ? '+' : '';
    const trendText = `${sign}${percentChange}% ${getComparisonLabel()}`;

    return {
      trend: trendText,
      icon: diff > 0 ? TrendingUp : TrendingDown,
      positive: isPositive
    };
  };

  const totalTrend = getTrendInfo(totalTests, compTotalTests);
  const passRateTrend = getTrendInfo(passRate, compPassRate);
  const failureTrend = getTrendInfo(failedTests, compFailedTests, true);
  const durationTrend = getTrendInfo(avgDuration, compAvgDuration, true);

  const stats = [
    {
      label: 'Total Tests',
      value: totalTests,
      icon: CheckCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/50',
      ...totalTrend
    },
    {
      label: 'Pass Rate',
      value: `${passRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/50',
      ...passRateTrend
    },
    {
      label: 'Failures',
      value: failedTests,
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/50',
      ...failureTrend
    },
    {
      label: 'Avg Duration',
      value: `${avgDuration.toFixed(0)}s`,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/50',
      ...durationTrend
    },
  ];

  return (
    <div className="space-y-2 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Today's Results {!isToday(selectedDate) && (
            <span className="text-gray-400 dark:text-gray-500">
              • Comparing to <span className="text-gray-700 dark:text-gray-300 font-semibold">{format(selectedDate, 'MMM dd, yyyy')}</span>
            </span>
          )}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              {!isToday(selectedDate) && (
                <stat.icon size={14} className={stat.positive ? 'text-green-500' : 'text-red-500'} />
              )}
              <span className={stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;
