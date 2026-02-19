import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Bot, Hand, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, Zap, ExternalLink, Tag, X
} from 'lucide-react';
import { ProjectData } from '../../services/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';

interface TestTypeSplitProps {
  projects: ProjectData[];
}

const AUTO_PASS = '#3B82F6';
const AUTO_FAIL = '#1E40AF';
const MANUAL_PASS = '#F59E0B';
const MANUAL_FAIL = '#B45309';

/**
 * Build an Azure DevOps test management URL from settings.
 * Always returns a usable URL — even without PAT the browser will prompt login.
 */
/**
 * Build an Azure DevOps test management URL from settings.
 * Always returns a URL — when org isn't configured, builds a placeholder URL
 * so the link structure is visible and works once the user sets up their org.
 */
function buildAzDoTestUrl(
  settings: any,
  projectName: string,
  outcome?: 'Passed' | 'Failed' | 'NotExecuted' | 'All',
  isAutomated?: boolean,
): string {
  const org = settings?.azureDevOps?.organization || '{your-org}';
  const baseUrl = settings?.azureDevOps?.baseUrl || 'https://dev.azure.com';

  const base = `${baseUrl}/${encodeURIComponent(org)}/${encodeURIComponent(projectName)}/_testManagement/runs`;
  const params = new URLSearchParams();
  params.set('_a', 'runQuery');
  if (outcome && outcome !== 'All') {
    params.set('outcomeFilter', outcome);
  }
  if (isAutomated !== undefined) {
    params.set('automatedFilter', isAutomated ? 'true' : 'false');
  }
  return `${base}?${params.toString()}`;
}

/**
 * Clickable stat that always opens Azure DevOps test results query.
 * Builds the URL from project/outcome/isAutomated using settings.
 * When org isn't configured, uses a placeholder so the link pattern is visible.
 */
const ClickableStat: React.FC<{
  value: number;
  project?: string;
  outcome?: 'Passed' | 'Failed' | 'NotExecuted' | 'All';
  isAutomated?: boolean;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}> = ({ value, project, outcome, isAutomated, className = '', title, children }) => {
  const { settings } = useSettings();
  const url = project ? buildAzDoTestUrl(settings, project, outcome, isAutomated) : '#';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} hover:underline cursor-pointer inline-flex items-center gap-0.5 group`}
      title={title || `View ${outcome || 'all'} ${isAutomated === true ? 'automated' : isAutomated === false ? 'manual' : ''} tests in Azure DevOps`}
      onClick={(e) => e.stopPropagation()}
    >
      {children || value}
      <ExternalLink size={8} className="opacity-0 group-hover:opacity-60 transition-opacity" />
    </a>
  );
};

const TestTypeSplit: React.FC<TestTypeSplitProps> = ({ projects }) => {
  const { isDark } = useTheme();
  const { settings } = useSettings();
  const compactView = settings?.dashboard?.compactView ?? false;

  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // All unique release versions
  const allReleaseVersions = useMemo(() => {
    return [...new Set(projects.map(p => p.releaseVersion).filter(Boolean))] as string[];
  }, [projects]);

  // Filter projects by selected version
  const filteredProjects = useMemo(() => {
    if (!selectedVersion) return projects;
    return projects.filter(p => p.releaseVersion === selectedVersion);
  }, [projects, selectedVersion]);

  // Aggregate totals from filtered projects
  const totalAutomated = filteredProjects.reduce((s, p) => s + (p.automated?.total || p.automatedTests || 0), 0);
  const totalManual = filteredProjects.reduce((s, p) => s + (p.manual?.total || p.manualTests || 0), 0);
  const totalTests = totalAutomated + totalManual;
  const automationRate = totalTests > 0 ? ((totalAutomated / totalTests) * 100).toFixed(1) : '0';

  const autoPassed = filteredProjects.reduce((s, p) => s + (p.automated?.passed || 0), 0);
  const autoFailed = filteredProjects.reduce((s, p) => s + (p.automated?.failed || 0), 0);
  const autoSkipped = filteredProjects.reduce((s, p) => s + (p.automated?.skipped || 0), 0);
  const manualPassed = filteredProjects.reduce((s, p) => s + (p.manual?.passed || 0), 0);
  const manualFailed = filteredProjects.reduce((s, p) => s + (p.manual?.failed || 0), 0);
  const manualSkipped = filteredProjects.reduce((s, p) => s + (p.manual?.skipped || 0), 0);
  const totalFlaky = filteredProjects.reduce((s, p) => s + (p.flakyTests || 0), 0);

  const autoPassRate = (autoPassed + autoFailed) > 0 ? ((autoPassed / (autoPassed + autoFailed)) * 100).toFixed(1) : '0';
  const manualPassRate = (manualPassed + manualFailed) > 0 ? ((manualPassed / (manualPassed + manualFailed)) * 100).toFixed(1) : '0';

  // Donut data
  const donutData = [
    { name: 'Auto Passed', value: autoPassed, color: AUTO_PASS },
    { name: 'Auto Failed', value: autoFailed, color: AUTO_FAIL },
    { name: 'Manual Passed', value: manualPassed, color: MANUAL_PASS },
    { name: 'Manual Failed', value: manualFailed, color: MANUAL_FAIL },
  ];

  // Per-project stacked bar
  const barData = filteredProjects.map(p => ({
    name: p.projectName.length > 16 ? p.projectName.slice(0, 14) + '…' : p.projectName,
    'Auto Passed': p.automated?.passed || 0,
    'Auto Failed': p.automated?.failed || 0,
    'Manual Passed': p.manual?.passed || 0,
    'Manual Failed': p.manual?.failed || 0,
  }));

  // Module detail
  const moduleData = filteredProjects.flatMap(p =>
    p.modules.map(m => ({
      projectId: p.projectId,
      projectName: p.projectName,
      module: m.moduleName,
      total: m.totalTests,
      autoPassed: m.automated?.passed || 0,
      autoFailed: m.automated?.failed || 0,
      autoTotal: m.automated?.total || m.automatedTests || 0,
      autoPassRate: m.automated?.passRate?.toFixed(1) || '0',
      manualPassed: m.manual?.passed || 0,
      manualFailed: m.manual?.failed || 0,
      manualTotal: m.manual?.total || m.manualTests || 0,
      manualPassRate: m.manual?.passRate?.toFixed(1) || '0',
      flaky: m.flakyTests || 0,
      automationPct: m.totalTests > 0 ? (((m.automated?.total || m.automatedTests || 0) / m.totalTests) * 100).toFixed(0) : '0',
    }))
  );

  // Automation gaps
  const automationGaps = moduleData
    .filter(m => Number(m.automationPct) < 50 && m.total > 10)
    .sort((a, b) => Number(a.automationPct) - Number(b.automationPct));

  // First project name for aggregate summary links
  const firstProject = filteredProjects[0]?.projectName || '';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
          {label && <div className="font-medium text-gray-900 dark:text-white mb-1">{label}</div>}
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-gray-600 dark:text-gray-400">{p.name}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const passRateColor = (rate: string) => {
    const n = Number(rate);
    if (n >= 95) return 'text-green-600 dark:text-green-400';
    if (n >= 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Count projects per version for badge display
  const versionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      if (p.releaseVersion) {
        counts[p.releaseVersion] = (counts[p.releaseVersion] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  return (
    <div className={`bg-white dark:bg-gray-800 ${compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-500" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Test Type Breakdown</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <span className="text-xs text-blue-600 dark:text-blue-300">Automation:</span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-200">{automationRate}%</span>
          </div>
          {totalFlaky > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/30">
              <Zap size={12} className="text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-300">Flaky:</span>
              <span className="text-sm font-bold text-red-700 dark:text-red-200">{totalFlaky}</span>
            </div>
          )}
        </div>
      </div>

      {/* Release version filter chips */}
      {allReleaseVersions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Tag size={12} />
            <span className="font-medium">Release:</span>
          </div>
          <button
            onClick={() => setSelectedVersion(null)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              !selectedVersion
                ? 'bg-purple-600 text-white border-purple-600 dark:bg-purple-500 dark:border-purple-500'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            All ({projects.length})
          </button>
          {allReleaseVersions.map(v => (
            <button
              key={v}
              onClick={() => setSelectedVersion(selectedVersion === v ? null : v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                selectedVersion === v
                  ? 'bg-purple-600 text-white border-purple-600 dark:bg-purple-500 dark:border-purple-500'
                  : 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20'
              }`}
            >
              {v}
              <span className={`text-[10px] ${selectedVersion === v ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}>
                ({versionCounts[v] || 0})
              </span>
              {selectedVersion === v && <X size={10} className="ml-0.5" />}
            </button>
          ))}
        </div>
      )}

      {/* Top row: Summary cards + Donut + Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        {/* Left: Summary cards + donut */}
        <div className="lg:w-2/5 flex flex-col gap-3">
          {/* Automated summary card */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
            <Bot size={18} className="text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Automated</span>
                <span className={`text-xs font-bold ${passRateColor(autoPassRate)}`}>{autoPassRate}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <ClickableStat value={totalAutomated} project={firstProject} outcome="All" isAutomated={true} className="text-blue-600 dark:text-blue-400 font-semibold" />
                <span className="text-gray-400">|</span>
                <ClickableStat value={autoPassed} project={firstProject} outcome="Passed" isAutomated={true} className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                  <><CheckCircle size={10} /> {autoPassed}</>
                </ClickableStat>
                <ClickableStat value={autoFailed} project={firstProject} outcome="Failed" isAutomated={true} className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                  <><XCircle size={10} /> {autoFailed}</>
                </ClickableStat>
                {autoSkipped > 0 && (
                  <ClickableStat value={autoSkipped} project={firstProject} outcome="NotExecuted" isAutomated={true} className="text-gray-500">
                    <>⊘ {autoSkipped}</>
                  </ClickableStat>
                )}
              </div>
              <div className="flex mt-1.5 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="bg-blue-500 h-full" style={{ width: `${totalAutomated > 0 ? (autoPassed / totalAutomated * 100) : 0}%` }} />
                <div className="bg-blue-900 h-full" style={{ width: `${totalAutomated > 0 ? (autoFailed / totalAutomated * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Manual summary card */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
            <Hand size={18} className="text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Manual</span>
                <span className={`text-xs font-bold ${passRateColor(manualPassRate)}`}>{manualPassRate}%</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <ClickableStat value={totalManual} project={firstProject} outcome="All" isAutomated={false} className="text-amber-600 dark:text-amber-400 font-semibold" />
                <span className="text-gray-400">|</span>
                <ClickableStat value={manualPassed} project={firstProject} outcome="Passed" isAutomated={false} className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                  <><CheckCircle size={10} /> {manualPassed}</>
                </ClickableStat>
                <ClickableStat value={manualFailed} project={firstProject} outcome="Failed" isAutomated={false} className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                  <><XCircle size={10} /> {manualFailed}</>
                </ClickableStat>
                {manualSkipped > 0 && (
                  <ClickableStat value={manualSkipped} project={firstProject} outcome="NotExecuted" isAutomated={false} className="text-gray-500">
                    <>⊘ {manualSkipped}</>
                  </ClickableStat>
                )}
              </div>
              <div className="flex mt-1.5 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div className="bg-amber-500 h-full" style={{ width: `${totalManual > 0 ? (manualPassed / totalManual * 100) : 0}%` }} />
                <div className="bg-amber-800 h-full" style={{ width: `${totalManual > 0 ? (manualFailed / totalManual * 100) : 0}%` }} />
              </div>
            </div>
          </div>

          {/* Donut */}
          <div className="flex justify-center">
            <div className="h-36 w-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] px-2">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: AUTO_PASS }} />Auto Pass</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: AUTO_FAIL }} />Auto Fail</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: MANUAL_PASS }} />Manual Pass</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: MANUAL_FAIL }} />Manual Fail</div>
          </div>
        </div>

        {/* Right: Per-project stacked bar */}
        <div className="lg:w-3/5">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Execution by Project</h4>
          <div className={compactView ? 'h-56' : 'h-64'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#374151' : '#eee'} />
                <XAxis type="number" tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#888' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#666' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Auto Passed" stackId="a" fill={AUTO_PASS} barSize={14} />
                <Bar dataKey="Auto Failed" stackId="a" fill={AUTO_FAIL} barSize={14} />
                <Bar dataKey="Manual Passed" stackId="a" fill={MANUAL_PASS} barSize={14} />
                <Bar dataKey="Manual Failed" stackId="a" fill={MANUAL_FAIL} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Automation Gaps Alert */}
      {automationGaps.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Automation Coverage Gaps</span>
            <span className="text-[10px] text-amber-500 dark:text-amber-400">— modules with &lt;50% automation</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {automationGaps.map((g, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                {g.module} <span className="opacity-60">({g.automationPct}%)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Module-level breakdown table */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Module Detail
            {selectedVersion && <span className="ml-1 text-purple-500 dark:text-purple-400">— {selectedVersion}</span>}
          </h4>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <ExternalLink size={9} /> Click numbers to view in Azure DevOps
          </span>
        </div>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Project / Module</th>
                <th className="text-center py-2 px-2 font-medium text-gray-600 dark:text-gray-400" colSpan={3}>
                  <span className="flex items-center justify-center gap-1"><Bot size={10} /> Automated</span>
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-600 dark:text-gray-400" colSpan={3}>
                  <span className="flex items-center justify-center gap-1"><Hand size={10} /> Manual</span>
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                  <span className="flex items-center justify-center gap-1"><Zap size={10} /> Flaky</span>
                </th>
                <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">Auto %</th>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-[29px] z-10">
                <th className="py-1 px-2"></th>
                <th className="py-1 px-2 text-center text-[10px] text-green-600 dark:text-green-400 font-normal">Pass</th>
                <th className="py-1 px-2 text-center text-[10px] text-red-600 dark:text-red-400 font-normal">Fail</th>
                <th className="py-1 px-2 text-center text-[10px] text-gray-500 font-normal">Rate</th>
                <th className="py-1 px-2 text-center text-[10px] text-green-600 dark:text-green-400 font-normal">Pass</th>
                <th className="py-1 px-2 text-center text-[10px] text-red-600 dark:text-red-400 font-normal">Fail</th>
                <th className="py-1 px-2 text-center text-[10px] text-gray-500 font-normal">Rate</th>
                <th className="py-1 px-2"></th>
                <th className="py-1 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No projects match <span className="font-medium text-purple-500">{selectedVersion}</span>
                    <button onClick={() => setSelectedVersion(null)} className="ml-2 text-xs text-blue-500 hover:underline">Clear filter</button>
                  </td>
                </tr>
              ) : filteredProjects.map(p => {
                const isExpanded = expandedProject === p.projectId;
                const pModules = moduleData.filter(m => m.projectId === p.projectId);
                return (
                  <React.Fragment key={p.projectId}>
                    {/* Project row */}
                    <tr
                      className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setExpandedProject(isExpanded ? null : p.projectId)}
                    >
                      <td className="py-2 px-2 font-semibold text-gray-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {p.projectName}
                          {p.releaseVersion && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-normal">{p.releaseVersion}</span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <ClickableStat value={p.automated?.passed || 0} project={p.projectName} outcome="Passed" isAutomated={true} className="text-green-600 dark:text-green-400 font-medium" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <ClickableStat value={p.automated?.failed || 0} project={p.projectName} outcome="Failed" isAutomated={true} className="text-red-600 dark:text-red-400 font-medium" />
                      </td>
                      <td className={`py-2 px-2 text-center font-bold ${passRateColor((p.automated?.passRate || 0).toFixed(1))}`}>
                        {(p.automated?.passRate || 0).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center">
                        <ClickableStat value={p.manual?.passed || 0} project={p.projectName} outcome="Passed" isAutomated={false} className="text-green-600 dark:text-green-400 font-medium" />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <ClickableStat value={p.manual?.failed || 0} project={p.projectName} outcome="Failed" isAutomated={false} className="text-red-600 dark:text-red-400 font-medium" />
                      </td>
                      <td className={`py-2 px-2 text-center font-bold ${passRateColor((p.manual?.passRate || 0).toFixed(1))}`}>
                        {(p.manual?.passRate || 0).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center">
                        {(p.flakyTests || 0) > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400 font-medium">
                            <Zap size={10} /> {p.flakyTests}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.totalTests > 0 ? ((p.automatedTests || 0) / p.totalTests * 100) : 0}%` }} />
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {p.totalTests > 0 ? ((p.automatedTests || 0) / p.totalTests * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Module rows */}
                    {isExpanded && pModules.map((row, i) => (
                      <tr key={`${p.projectId}-${i}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="py-1.5 px-2 pl-8 text-gray-700 dark:text-gray-300">{row.module}</td>
                        <td className="py-1.5 px-2 text-center">
                          <ClickableStat value={row.autoPassed} project={row.projectName} outcome="Passed" isAutomated={true} className="text-green-600 dark:text-green-400" />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <ClickableStat value={row.autoFailed} project={row.projectName} outcome="Failed" isAutomated={true} className="text-red-600 dark:text-red-400" />
                        </td>
                        <td className={`py-1.5 px-2 text-center ${passRateColor(row.autoPassRate)}`}>{row.autoPassRate}%</td>
                        <td className="py-1.5 px-2 text-center">
                          <ClickableStat value={row.manualPassed} project={row.projectName} outcome="Passed" isAutomated={false} className="text-green-600 dark:text-green-400" />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <ClickableStat value={row.manualFailed} project={row.projectName} outcome="Failed" isAutomated={false} className="text-red-600 dark:text-red-400" />
                        </td>
                        <td className={`py-1.5 px-2 text-center ${passRateColor(row.manualPassRate)}`}>{row.manualPassRate}%</td>
                        <td className="py-1.5 px-2 text-center">
                          {row.flaky > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-red-500 text-[10px]">
                              <Zap size={8} /> {row.flaky}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.automationPct}%` }} />
                            </div>
                            <span className={`text-[10px] font-medium ${Number(row.automationPct) >= 80 ? 'text-green-600 dark:text-green-400' : Number(row.automationPct) >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                              {row.automationPct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestTypeSplit;

