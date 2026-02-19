import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FolderKanban, Package, CheckCircle, XCircle, SkipForward, Bug, ExternalLink, Play, TrendingUp, TrendingDown, Minus, Clock, RefreshCw, History } from 'lucide-react';
import { ProjectData, ModuleTestResult, Defect } from '../../services/mockData';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import { useSettings } from '../../context/SettingsContext';

interface ProjectModuleOverviewProps {
  projects: ProjectData[];
  defects: Defect[];
  selectedDate: Date;
  comparisonProjects?: ProjectData[];
  onCreateDefect?: (moduleId: string, moduleName: string, projectName: string) => void;
}

// Clickable stat component
const ClickableStat: React.FC<{
  value: number | string;
  href: string;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}> = ({ value, href, className = '', title, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`hover:underline cursor-pointer transition-opacity hover:opacity-80 ${className}`}
    title={title || 'Click to view in Azure DevOps'}
  >
    {children || value}
  </a>
);

const ProjectModuleOverview: React.FC<ProjectModuleOverviewProps> = ({ projects, defects, selectedDate, comparisonProjects, onCreateDefect }) => {
  const { settings } = useSettings();

  // Get display settings with defaults
  const autoExpandProjects = settings?.dashboard?.autoExpandProjects ?? true;
  const compactView = settings?.dashboard?.compactView ?? false;

  // Helper to generate Azure DevOps URLs using settings
  const getAzDoUrls = (projectName: string, moduleName?: string) => {
    const organization = settings.azureDevOps?.organization || '{your-org}';
    const baseUrl = settings.azureDevOps?.baseUrl || 'https://dev.azure.com';
    const base = `${baseUrl}/${encodeURIComponent(organization)}/${encodeURIComponent(projectName)}`;

    return {
      // Test Plans & Runs
      testPlans: `${base}/_testManagement/runs`,
      testRuns: `${base}/_testManagement/runs?_a=runQuery`,

      // Work Items queries for different statuses
      allTests: `${base}/_workitems/recentlyupdated`,
      passedTests: `${base}/_testManagement/runs?_a=runQuery&status=passed`,
      failedTests: `${base}/_testManagement/runs?_a=runQuery&status=failed`,

      // Defects/Bugs query
      defects: `${base}/_workitems/recentlyupdated?types=Bug&states=Active,New`,
      defectQuery: (defectIds: string[]) => {
        const ids = defectIds.join(',');
        return `${base}/_workitems?ids=${ids}`;
      },

      // Specific work item
      workItem: (id: string) => `${base}/_workitems/edit/${id.replace(/\D/g, '')}`,
    };
  };

  // Initialize expanded projects based on autoExpandProjects setting
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    if (autoExpandProjects && projects.length > 0) {
      return new Set(projects.map(p => p.projectId));
    }
    return new Set();
  });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Handle auto-expand setting changes
  useEffect(() => {
    if (autoExpandProjects && projects.length > 0) {
      setExpandedProjects(new Set(projects.map(p => p.projectId)));
    }
  }, [autoExpandProjects, projects]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 95) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50';
    if (passRate >= 85) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50';
    if (passRate >= 70) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50';
  };

  const getProgressBarColor = (passRate: number) => {
    if (passRate >= 95) return 'bg-green-500';
    if (passRate >= 85) return 'bg-yellow-500';
    if (passRate >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLinkedDefects = (defectIds: string[]) => {
    return defects.filter(d => defectIds.includes(d.id));
  };

  // Comparison mode: 'date' = compare to selected date, 'run' = compare to previous run
  const [comparisonMode, setComparisonMode] = useState<'date' | 'run'>('run');

  // Calculate totals from current (latest) run
  const totalTests = projects.reduce((acc, p) => acc + p.totalTests, 0);
  const totalExecuted = projects.reduce((acc, p) => acc + p.executed, 0);
  const totalPassed = projects.reduce((acc, p) => acc + p.passed, 0);
  const totalFailed = projects.reduce((acc, p) => acc + p.failed, 0);
  const totalSkipped = projects.reduce((acc, p) => acc + p.skipped, 0);
  const overallPassRate = totalExecuted > 0 ? ((totalPassed / totalExecuted) * 100) : 0;

  // Total run count for today
  const totalRunsToday = projects.reduce((acc, p) => Math.max(acc, p.runCount || 1), 0);

  // Latest run time
  const latestRunTime = projects.reduce((latest, p) => {
    if (p.lastRunTime && (!latest || new Date(p.lastRunTime) > new Date(latest))) {
      return p.lastRunTime;
    }
    return latest;
  }, '' as string);

  // Calculate comparison totals based on mode
  const getComparisonData = () => {
    if (comparisonMode === 'run') {
      // Compare to previous run
      const prevPassed = projects.reduce((acc, p) => acc + (p.previousRun?.passed || p.passed), 0);
      const prevFailed = projects.reduce((acc, p) => acc + (p.previousRun?.failed || p.failed), 0);
      const prevSkipped = projects.reduce((acc, p) => acc + (p.previousRun?.skipped || p.skipped), 0);
      const prevExecuted = prevPassed + prevFailed + prevSkipped;
      return {
        passed: prevPassed,
        failed: prevFailed,
        skipped: prevSkipped,
        executed: prevExecuted,
        passRate: prevExecuted > 0 ? (prevPassed / prevExecuted) * 100 : 0,
      };
    } else {
      // Compare to selected date
      const compProjects = comparisonProjects || projects;
      return {
        passed: compProjects.reduce((acc, p) => acc + p.passed, 0),
        failed: compProjects.reduce((acc, p) => acc + p.failed, 0),
        skipped: compProjects.reduce((acc, p) => acc + p.skipped, 0),
        executed: compProjects.reduce((acc, p) => acc + p.executed, 0),
        passRate: 0, // Calculate below
      };
    }
  };

  const compData = getComparisonData();
  const compPassRate = compData.executed > 0 ? (compData.passed / compData.executed) * 100 : 0;

  // Calculate trends
  const getTrend = (current: number, comparison: number, isLowerBetter: boolean = false) => {
    const diff = current - comparison;
    const percent = comparison !== 0 ? ((diff / comparison) * 100) : (diff !== 0 ? 100 : 0);
    const isPositive = isLowerBetter ? diff <= 0 : diff >= 0;
    return { value: percent, isPositive, show: true, diff };
  };

  const passRateTrend = getTrend(overallPassRate, compPassRate);
  const passedTrend = getTrend(totalPassed, compData.passed);
  const failedTrend = getTrend(totalFailed, compData.failed, true);

  const getComparisonLabel = () => {
    if (comparisonMode === 'run') {
      const prevRunTime = projects[0]?.previousRun?.runTime;
      if (prevRunTime) {
        return `vs ${formatDistanceToNow(new Date(prevRunTime), { addSuffix: true })}`;
      }
      return 'vs Previous Run';
    }
    return `vs ${format(selectedDate, 'MMM dd')}`;
  };

  // Get Azure DevOps URLs for summary stats
  const summaryUrls = getAzDoUrls('All Projects');

  return (
    <div className={`bg-white dark:bg-gray-800 ${compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      {/* Header */}
      <div className={`flex flex-col ${compactView ? 'gap-2 mb-3' : 'gap-3 mb-4'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="text-blue-500" size={20} />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Projects & Modules</h3>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Run Info */}
            {latestRunTime && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                <Clock size={12} />
                <span className="hidden sm:inline">Last run: </span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDistanceToNow(new Date(latestRunTime), { addSuffix: true })}</span>
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span><span className="text-gray-700 dark:text-gray-300 font-medium">{totalRunsToday}</span> runs</span>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Compare:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setComparisonMode('run')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                  comparisonMode === 'run'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <History size={12} />
                <span className="hidden sm:inline">Previous </span>Run
              </button>
              <button
                onClick={() => setComparisonMode('date')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                  comparisonMode === 'date'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Clock size={12} />
                {format(selectedDate, 'MMM dd')}
              </button>
            </div>
            {comparisonMode === 'run' && projects[0]?.previousRun?.runTime && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({format(new Date(projects[0].previousRun.runTime), 'h:mm a')})
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {projects.length} Projects • {projects.reduce((acc, p) => acc + p.modules.length, 0)} Modules • {totalTests} Tests
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex flex-col items-center justify-start">
          <ClickableStat
            value={totalTests}
            href={summaryUrls.testPlans}
            className="text-base sm:text-xl font-bold text-gray-900 dark:text-white"
            title="View all test plans in Azure DevOps"
          />
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total</div>
        </div>
        <div className="flex flex-col items-center justify-start">
          <ClickableStat
            value={totalExecuted}
            href={summaryUrls.testRuns}
            className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400"
            title="View test runs in Azure DevOps"
          />
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <Play size={10} /> Exec
          </div>
        </div>
        <div className="flex flex-col items-center justify-start">
          <ClickableStat
            value={totalPassed}
            href={summaryUrls.passedTests}
            className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400"
            title="View passed tests in Azure DevOps"
          />
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <CheckCircle size={10} /> Pass
          </div>
          {passedTrend.show && (
            <div className={`text-[10px] sm:text-xs flex items-center justify-center gap-0.5 mt-1 ${passedTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passedTrend.value > 0 ? <TrendingUp size={10} /> : passedTrend.value < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
              {passedTrend.value > 0 ? '+' : ''}{passedTrend.value.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-start">
          <ClickableStat
            value={totalFailed}
            href={summaryUrls.failedTests}
            className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400"
            title="View failed tests in Azure DevOps"
          />
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <XCircle size={10} /> Fail
          </div>
          {failedTrend.show && (
            <div className={`text-[10px] sm:text-xs flex items-center justify-center gap-0.5 mt-1 ${failedTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {failedTrend.value < 0 ? <TrendingDown size={10} /> : failedTrend.value > 0 ? <TrendingUp size={10} /> : <Minus size={10} />}
              {failedTrend.value > 0 ? '+' : ''}{failedTrend.value.toFixed(1)}%
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-start">
          <div className="text-base sm:text-xl font-bold text-gray-600 dark:text-gray-400">{totalSkipped}</div>
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
            <SkipForward size={10} /> Skip
          </div>
        </div>
        <div className="flex flex-col items-center justify-start">
          <div className={`text-base sm:text-xl font-bold px-1.5 sm:px-2 py-0.5 rounded inline-block ${getPassRateColor(overallPassRate)}`}>
            {overallPassRate.toFixed(1)}%
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Rate</div>
          {passRateTrend.show && (
            <div className={`text-[10px] sm:text-xs flex items-center justify-center gap-0.5 mt-1 ${passRateTrend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passRateTrend.value > 0 ? <TrendingUp size={10} /> : passRateTrend.value < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
              {passRateTrend.value > 0 ? '+' : ''}{passRateTrend.value.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {projects.map((project) => {
          const projectUrls = getAzDoUrls(project.projectName);

          return (
          <div key={project.projectId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Project Header */}
            <div
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2" onClick={() => toggleProject(project.projectId)}>
                {expandedProjects.has(project.projectId) ? (
                  <ChevronDown size={18} className="text-gray-500" />
                ) : (
                  <ChevronRight size={18} className="text-gray-500" />
                )}
                <FolderKanban size={18} className="text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white">{project.projectName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">({project.modules.length} modules)</span>
                {project.releaseVersion && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">{project.releaseVersion}</span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-4">
                  <ClickableStat
                    value={project.totalTests}
                    href={projectUrls.testPlans}
                    className="text-gray-600 dark:text-gray-300"
                    title={`View all tests for ${project.projectName}`}
                  >
                    {project.totalTests} tests
                  </ClickableStat>
                  <ClickableStat
                    value={project.passed}
                    href={projectUrls.passedTests}
                    className="text-green-600 dark:text-green-400 flex items-center gap-1"
                    title={`View passed tests for ${project.projectName}`}
                  >
                    <CheckCircle size={14} /> {project.passed}
                  </ClickableStat>
                  <ClickableStat
                    value={project.failed}
                    href={projectUrls.failedTests}
                    className="text-red-600 dark:text-red-400 flex items-center gap-1"
                    title={`View failed tests for ${project.projectName}`}
                  >
                    <XCircle size={14} /> {project.failed}
                  </ClickableStat>
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <SkipForward size={14} /> {project.skipped}
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded text-xs font-medium ${getPassRateColor(project.passRate)}`}>
                  {project.passRate}%
                </div>
              </div>
            </div>

            {/* Modules List */}
            {expandedProjects.has(project.projectId) && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {project.modules.map((module) => {
                  const linkedDefects = getLinkedDefects(module.linkedDefects);
                  const isExpanded = expandedModules.has(module.moduleId);
                  const moduleUrls = getAzDoUrls(project.projectName, module.moduleName);

                  return (
                    <div key={module.moduleId} className="bg-white dark:bg-gray-800">
                      {/* Module Row */}
                      <div
                        className={`flex items-center justify-between p-3 pl-10 ${module.linkedDefects.length > 0 ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors`}
                      >
                        <div className="flex items-center gap-2" onClick={() => module.linkedDefects.length > 0 && toggleModule(module.moduleId)}>
                          {module.linkedDefects.length > 0 ? (
                            isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />
                          ) : (
                            <div className="w-4" />
                          )}
                          <Package size={16} className="text-purple-500" />
                          <span className="text-sm text-gray-800 dark:text-gray-200">{module.moduleName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                            <ClickableStat
                              value={module.totalTests}
                              href={moduleUrls.testPlans}
                              title={`View all tests for ${module.moduleName}`}
                            />
                            <ClickableStat
                              value={module.executed}
                              href={moduleUrls.testRuns}
                              className="text-blue-600 dark:text-blue-400"
                              title={`View executed tests for ${module.moduleName}`}
                            >
                              <Play size={12} className="inline mr-0.5" />{module.executed}
                            </ClickableStat>
                            <ClickableStat
                              value={module.passed}
                              href={moduleUrls.passedTests}
                              className="text-green-600 dark:text-green-400"
                              title={`View passed tests for ${module.moduleName}`}
                            >
                              <CheckCircle size={12} className="inline mr-0.5" />{module.passed}
                            </ClickableStat>
                            <ClickableStat
                              value={module.failed}
                              href={moduleUrls.failedTests}
                              className="text-red-600 dark:text-red-400"
                              title={`View failed tests for ${module.moduleName}`}
                            >
                              <XCircle size={12} className="inline mr-0.5" />{module.failed}
                            </ClickableStat>
                            <span className="text-gray-500 dark:text-gray-400" title="Skipped">
                              <SkipForward size={12} className="inline mr-0.5" />{module.skipped}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressBarColor(module.passRate)}`}
                              style={{ width: `${module.passRate}%` }}
                            />
                          </div>

                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPassRateColor(module.passRate)}`}>
                            {module.passRate}%
                          </span>

                          {/* Defect Badge */}
                          {module.linkedDefects.length > 0 ? (
                            <a
                              href={moduleUrls.defectQuery(module.linkedDefects)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                              title="View linked defects in Azure DevOps"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Bug size={12} /> {module.linkedDefects.length}
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-xs">
                              No defects
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Defects Detail */}
                      {isExpanded && linkedDefects.length > 0 && (
                        <div className="pl-16 pr-3 pb-3">
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 space-y-2">
                            <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">Linked Defects:</div>
                            {linkedDefects.map(defect => {
                              const defectUrl = moduleUrls.workItem(defect.id);
                              return (
                              <div key={defect.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                                    defect.severity === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                                    defect.severity === 'major' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                                    defect.severity === 'minor' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {defect.severity.toUpperCase()}
                                  </span>
                                  <a
                                    href={defectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                    title="View defect in Azure DevOps"
                                  >
                                    {defect.id}
                                  </a>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{defect.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                                    defect.status === 'open' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                                    defect.status === 'in-progress' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                    defect.status === 'resolved' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                    'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  }`}>
                                    {defect.status}
                                  </span>
                                  <a
                                    href={defectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-colors"
                                    title="Open in Azure DevOps"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                </div>
                              </div>
                            )})}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectModuleOverview;

