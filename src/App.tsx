import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/dashboard/DashboardHeader';
import TrendAnalysis from './components/dashboard/TrendAnalysis';
import ProjectModuleOverview from './components/dashboard/ProjectModuleOverview';
import ComparisonView from './components/dashboard/ComparisonView';
import TestDistributionChart from './components/dashboard/TestDistributionChart';
import DefectsTraceability from './components/dashboard/DefectsTraceability';
import { useSettings } from './context/SettingsContext';
import {
  getTrendData,
  getComparisonData,
  getDefects,
  getTestFailureDefects,
  getProjectsData,
  Environment
} from './services/mockData';

function App() {
  const settingsContext = useSettings();

  // Handle case where settings context is not ready
  if (!settingsContext || !settingsContext.settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { settings, getEnabledEnvironments } = settingsContext;
  const enabledEnvs = getEnabledEnvironments() || [];
  const defaultEnv = settings?.dashboard?.defaultEnvironment || enabledEnvs[0]?.name || 'Stage';

  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(defaultEnv);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [trends, setTrends] = useState(getTrendData(selectedEnvironment));
  const [projects, setProjects] = useState(getProjectsData(selectedEnvironment, selectedDate));
  const [comparison, setComparison] = useState(getComparisonData(selectedEnvironment));
  const [defects, setDefects] = useState(getDefects(selectedEnvironment));
  const [testFailures, setTestFailures] = useState(getTestFailureDefects(selectedEnvironment, selectedDate));

  const refreshData = () => {
    setLoading(true);
    // Simulate API fetch
    setTimeout(() => {
      setTrends(getTrendData(selectedEnvironment));
      setProjects(getProjectsData(selectedEnvironment, selectedDate));
      setComparison(getComparisonData(selectedEnvironment));
      setDefects(getDefects(selectedEnvironment));
      setTestFailures(getTestFailureDefects(selectedEnvironment, selectedDate));
      setLoading(false);
    }, 800);
  };

  const handleEnvironmentChange = (env: Environment) => {
    setSelectedEnvironment(env);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    refreshData();
  }, [selectedEnvironment, selectedDate]);

  // Get display settings
  const compactView = settings?.dashboard?.compactView ?? false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${compactView ? 'py-4' : 'py-8'}`}>
        <DashboardHeader
          onRefresh={refreshData}
          selectedEnvironment={selectedEnvironment}
          onEnvironmentChange={handleEnvironmentChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        <div id="dashboard-content" className={compactView ? 'space-y-4' : 'space-y-6'}>
          {/* Projects & Modules Overview - Primary View at Top */}
          <ProjectModuleOverview
            projects={projects}
            defects={defects}
            selectedDate={selectedDate}
            comparisonProjects={projects} // In real app, this would be different data for selected date
          />

          {/* Trend Analysis and Test Distribution - Same Height */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactView ? 'gap-4' : 'gap-6'}`}>
            <TrendAnalysis data={trends} />
            <TestDistributionChart projects={projects} defects={defects} />
          </div>

          {/* Defects & Traceability Section */}
          <DefectsTraceability defects={defects} testFailures={testFailures} selectedEnvironment={selectedEnvironment} />

          <div className={`grid grid-cols-1 ${compactView ? 'gap-4' : 'gap-6'}`}>
            <ComparisonView data={comparison} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
