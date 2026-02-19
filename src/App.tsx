import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/dashboard/DashboardHeader';
import TrendAnalysis from './components/dashboard/TrendAnalysis';
import ProjectModuleOverview from './components/dashboard/ProjectModuleOverview';
import ComparisonView from './components/dashboard/ComparisonView';
import TestDistributionChart from './components/dashboard/TestDistributionChart';
import DefectsTraceability from './components/dashboard/DefectsTraceability';
import TestTypeSplit from './components/dashboard/TestTypeSplit';
import { useSettings } from './context/SettingsContext';
import { createAzureDevOpsService } from './services/azureDevOpsService';
import {
  getTrendData,
  getComparisonData,
  getDefects,
  getTestFailureDefects,
  getProjectsData,
  ProjectData,
  TestTrend,
  ComparisonData,
  Defect,
  TestFailureDefect,
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

  const { settings, getEnabledEnvironments, isConfigured } = settingsContext;
  const enabledEnvs = getEnabledEnvironments() || [];
  const defaultEnv = settings?.dashboard?.defaultEnvironment || enabledEnvs[0]?.name || 'Stage';
  const dataSource = settings?.dashboard?.dataSource || 'demo';


  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>(defaultEnv);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);

  const [trends, setTrends] = useState<TestTrend[]>(getTrendData(selectedEnvironment));
  const [projects, setProjects] = useState<ProjectData[]>(getProjectsData(selectedEnvironment, selectedDate));
  const [comparison, setComparison] = useState<ComparisonData[]>(getComparisonData(selectedEnvironment));
  const [defects, setDefects] = useState<Defect[]>(getDefects(selectedEnvironment));
  const [testFailures, setTestFailures] = useState<TestFailureDefect[]>(getTestFailureDefects(selectedEnvironment, selectedDate));

  /**
   * Fetch data from Azure DevOps pipelines.
   * For each configured project, fetches all pipeline builds for the selected date
   * and aggregates test results. Each pipeline becomes a "module" in the dashboard.
   */
  const fetchFromPipelines = async () => {
    const service = createAzureDevOpsService(settings.azureDevOps);
    if (!service) {
      setDataSourceError('Azure DevOps not configured. Go to Settings → Azure DevOps to set up connection.');
      return;
    }
    setDataSourceError(null);

    try {
      const enabledProjects = settings.projects.filter(p => p.enabled);
      const projectNames = enabledProjects.length > 0
        ? enabledProjects.map(p => p.name)
        : (await service.getProjects()).map(p => p.name);

      const projectDataList: ProjectData[] = [];
      for (const projName of projectNames) {
        const data = await service.getProjectDataFromPipelines(projName, selectedEnvironment, selectedDate);
        if (data) projectDataList.push(data);
      }

      setProjects(projectDataList);

      // Fetch defects
      const allDefects: Defect[] = [];
      for (const projName of projectNames) {
        try {
          const azDefects = await service.getDefects(projName);
          allDefects.push(...service.transformDefects(azDefects, selectedEnvironment));
        } catch { /* skip */ }
      }
      setDefects(allDefects);

      // Trends and comparison still use mock for now (these require historical aggregation)
      setTrends(getTrendData(selectedEnvironment));
      setComparison(getComparisonData(selectedEnvironment));
      setTestFailures(getTestFailureDefects(selectedEnvironment, selectedDate));
    } catch (err: any) {
      console.error('Pipeline fetch error:', err);
      setDataSourceError(`Failed to fetch pipeline data: ${err.message}`);
    }
  };

  /**
   * Fetch data from Azure DevOps Test Plans / Test Runs API.
   * Reads test runs by date range and groups by area paths (modules).
   */
  const fetchFromTestPlans = async () => {
    const service = createAzureDevOpsService(settings.azureDevOps);
    if (!service) {
      setDataSourceError('Azure DevOps not configured. Go to Settings → Azure DevOps to set up connection.');
      return;
    }
    setDataSourceError(null);

    try {
      const enabledProjects = settings.projects.filter(p => p.enabled);
      const projectNames = enabledProjects.length > 0
        ? enabledProjects.map(p => p.name)
        : (await service.getProjects()).map(p => p.name);

      const projectDataList: ProjectData[] = [];
      for (const projName of projectNames) {
        const data = await service.getProjectData(projName, selectedEnvironment);
        if (data) projectDataList.push(data);
      }

      setProjects(projectDataList);

      // Fetch defects
      const allDefects: Defect[] = [];
      for (const projName of projectNames) {
        try {
          const azDefects = await service.getDefects(projName);
          allDefects.push(...service.transformDefects(azDefects, selectedEnvironment));
        } catch { /* skip */ }
      }
      setDefects(allDefects);

      // Trends and comparison still use mock
      setTrends(getTrendData(selectedEnvironment));
      setComparison(getComparisonData(selectedEnvironment));
      setTestFailures(getTestFailureDefects(selectedEnvironment, selectedDate));
    } catch (err: any) {
      console.error('Test Plans fetch error:', err);
      setDataSourceError(`Failed to fetch Test Plans data: ${err.message}`);
    }
  };

  /**
   * Fetch data from mock/demo data.
   */
  const fetchFromDemo = () => {
    setDataSourceError(null);
    setTrends(getTrendData(selectedEnvironment));
    setProjects(getProjectsData(selectedEnvironment, selectedDate));
    setComparison(getComparisonData(selectedEnvironment));
    setDefects(getDefects(selectedEnvironment));
    setTestFailures(getTestFailureDefects(selectedEnvironment, selectedDate));
  };

  const refreshData = async () => {
    setLoading(true);

    try {
      if (dataSource === 'pipelines' && isConfigured) {
        await fetchFromPipelines();
      } else if (dataSource === 'testplans' && isConfigured) {
        await fetchFromTestPlans();
      } else {
        // Fallback to demo data
        fetchFromDemo();
      }
    } catch (err: any) {
      console.error('Refresh error:', err);
      setDataSourceError(err.message);
    }

    setLoading(false);
  };

  const handleEnvironmentChange = (env: Environment) => {
    setSelectedEnvironment(env);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    refreshData();
  }, [selectedEnvironment, selectedDate, dataSource]);

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
          {/* Data Source Indicator */}
          {dataSource !== 'demo' && (
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
              isConfigured
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span>
                Data source: <strong>{dataSource === 'pipelines' ? 'Pipelines → Test Runs' : 'Test Plans → Test Runs'}</strong>
                {!isConfigured && ' (not configured — using demo data)'}
              </span>
            </div>
          )}

          {/* Data Source Error */}
          {dataSourceError && (
            <div className="flex items-start gap-2 text-sm px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              <span className="font-medium shrink-0">⚠</span>
              <span>{dataSourceError}</span>
            </div>
          )}
          {/* Projects & Modules Overview - Primary View at Top */}
          <ProjectModuleOverview
            projects={projects}
            defects={defects}
            selectedDate={selectedDate}
            comparisonProjects={projects}
          />

          {/* Trend Analysis and Test Distribution - Same Height */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 ${compactView ? 'gap-4' : 'gap-6'}`}>
            <TrendAnalysis data={trends} />
            <TestDistributionChart projects={projects} defects={defects} />
          </div>

          {/* Defects & Traceability Section */}
          <DefectsTraceability defects={defects} testFailures={testFailures} selectedEnvironment={selectedEnvironment} />

          {/* Test Type Breakdown (Automated vs Manual) */}
          <TestTypeSplit projects={projects} />

          <div className={`grid grid-cols-1 ${compactView ? 'gap-4' : 'gap-6'}`}>
            <ComparisonView data={comparison} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
