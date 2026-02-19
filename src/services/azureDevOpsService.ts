/**
 * Azure DevOps API Service
 *
 * This service handles all communication with Azure DevOps REST APIs.
 * It fetches test results, defects, pipelines, and other data.
 *
 * When Azure DevOps is not configured, the dashboard falls back to mock data.
 */

import {
  TestSuite,
  TestTrend,
  ActivityLog,
  ComparisonData,
  Defect,
  ProjectData,
  ModuleTestResult,
  TestTypeBreakdown,
  Environment
} from './mockData';

/** Build a TestTypeBreakdown from total/passed/failed/skipped */
function buildBreakdown(total: number, passed: number, failed: number, skipped: number): TestTypeBreakdown {
  return {
    total,
    passed,
    failed,
    skipped,
    passRate: (passed + failed) > 0 ? parseFloat(((passed / (passed + failed)) * 100).toFixed(1)) : 0,
  };
}

export interface AzureDevOpsConfig {
  organization: string;
  personalAccessToken: string;
  baseUrl: string;
}

export interface AzureTestRun {
  id: number;
  name: string;
  state: string;
  isAutomated: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  notApplicableTests: number;
  startedDate: string;
  completedDate: string;
  buildConfiguration: {
    platform: string;
    flavor: string;
  };
}

export interface AzureTestResult {
  id: number;
  testCaseTitle: string;
  outcome: 'Passed' | 'Failed' | 'NotExecuted' | 'Blocked';
  state: string;
  durationInMs: number;
  errorMessage?: string;
  stackTrace?: string;
  automatedTestName?: string;
  automatedTestType?: string;
  testCase: {
    id: string;
    name: string;
  };
}

export interface AzureWorkItem {
  id: number;
  fields: {
    'System.Title': string;
    'System.State': string;
    'System.AssignedTo'?: { displayName: string };
    'Microsoft.VSTS.Common.Severity'?: string;
    'System.CreatedDate': string;
    'System.AreaPath': string;
  };
}

export interface AzureBuild {
  id: number;
  buildNumber: string;
  status: string;
  result: string;
  queueTime: string;
  startTime: string;
  finishTime: string;
  definition: {
    name: string;
    id: number;
  };
}

/**
 * Azure DevOps API Service Class
 */
export class AzureDevOpsService {
  private baseUrl: string;
  private organization: string;
  private token: string;
  private apiVersion: string = '7.0';

  constructor(config: AzureDevOpsConfig) {
    this.baseUrl = config.baseUrl || 'https://dev.azure.com';
    this.organization = config.organization;
    this.token = config.personalAccessToken;
  }

  /**
   * Get authorization headers for API requests
   */
  private get headers(): HeadersInit {
    const encodedToken = btoa(`:${this.token}`);
    return {
      'Authorization': `Basic ${encodedToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Build API URL
   */
  private buildUrl(project: string, path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}/${this.organization}/${project}/_apis/${path}`);
    url.searchParams.set('api-version', this.apiVersion);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Make an API request
   */
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test the connection to Azure DevOps
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.organization}/_apis/projects?api-version=${this.apiVersion}`;
      const response = await this.request<{ count: number }>(url);
      return response.count >= 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get list of projects
   */
  async getProjects(): Promise<{ id: string; name: string }[]> {
    const url = `${this.baseUrl}/${this.organization}/_apis/projects?api-version=${this.apiVersion}`;
    const response = await this.request<{ value: { id: string; name: string }[] }>(url);
    return response.value;
  }

  /**
   * Get test runs for a project
   */
  async getTestRuns(project: string, fromDate?: Date, toDate?: Date): Promise<AzureTestRun[]> {
    const params: Record<string, string> = {};

    if (fromDate) {
      params.minLastUpdatedDate = fromDate.toISOString();
    }
    if (toDate) {
      params.maxLastUpdatedDate = toDate.toISOString();
    }

    const url = this.buildUrl(project, 'test/runs', params);
    const response = await this.request<{ value: AzureTestRun[] }>(url);
    return response.value;
  }

  /**
   * Get test results for a specific run
   */
  async getTestResults(project: string, runId: number): Promise<AzureTestResult[]> {
    const url = this.buildUrl(project, `test/runs/${runId}/results`);
    const response = await this.request<{ value: AzureTestResult[] }>(url);
    return response.value;
  }

  /**
   * Get defects (bugs) for a project
   */
  async getDefects(project: string, states?: string[]): Promise<AzureWorkItem[]> {
    const stateFilter = states?.length
      ? `AND [System.State] IN ('${states.join("','")}')`
      : "AND [System.State] <> 'Closed'";

    const query = {
      query: `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '${project}' AND [System.WorkItemType] = 'Bug' ${stateFilter} ORDER BY [System.CreatedDate] DESC`
    };

    const url = this.buildUrl(project, 'wit/wiql');
    const wiqlResponse = await this.request<{ workItems: { id: number }[] }>(url, {
      method: 'POST',
      body: JSON.stringify(query),
    });

    if (!wiqlResponse.workItems?.length) {
      return [];
    }

    // Fetch work item details
    const ids = wiqlResponse.workItems.map(wi => wi.id).slice(0, 200); // Limit to 200
    const detailsUrl = `${this.baseUrl}/${this.organization}/${project}/_apis/wit/workitems?ids=${ids.join(',')}&api-version=${this.apiVersion}`;
    const detailsResponse = await this.request<{ value: AzureWorkItem[] }>(detailsUrl);

    return detailsResponse.value;
  }

  /**
   * Get builds for a project
   */
  async getBuilds(project: string, top?: number): Promise<AzureBuild[]> {
    const params: Record<string, string> = {};
    if (top) {
      params['$top'] = top.toString();
    }

    const url = this.buildUrl(project, 'build/builds', params);
    const response = await this.request<{ value: AzureBuild[] }>(url);
    return response.value;
  }

  /**
   * Get builds filtered by date range
   */
  async getBuildsByDate(project: string, fromDate: Date, toDate?: Date, top = 100): Promise<AzureBuild[]> {
    const params: Record<string, string> = {
      'minTime': fromDate.toISOString(),
      '$top': top.toString(),
    };
    if (toDate) {
      params['maxTime'] = toDate.toISOString();
    }

    const url = this.buildUrl(project, 'build/builds', params);
    const response = await this.request<{ value: AzureBuild[] }>(url);
    return response.value;
  }

  /**
   * Get test runs associated with a specific build/pipeline run
   * This is what appears in the Pipeline "Tests" tab
   */
  async getTestRunsForBuild(project: string, buildId: number): Promise<AzureTestRun[]> {
    const url = this.buildUrl(project, 'test/runs', { buildUri: `vstfs:///Build/Build/${buildId}` });
    const response = await this.request<{ value: AzureTestRun[] }>(url);
    return response.value;
  }

  /**
   * Pipeline-centric: Get all test results across all pipelines for a date.
   * Flow: getBuilds(date) → for each build → getTestRunsForBuild → getTestResults
   * Results are grouped by pipeline definition (name).
   */
  async getTestResultsByPipelines(
    project: string,
    date: Date
  ): Promise<{
    pipelineName: string;
    definitionId: number;
    buildId: number;
    buildNumber: string;
    completedDate: string;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    results: AzureTestResult[];
  }[]> {
    // Get start/end of the target date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch builds for the date
    const builds = await this.getBuildsByDate(project, startOfDay, endOfDay);

    const pipelineResults: {
      pipelineName: string;
      definitionId: number;
      buildId: number;
      buildNumber: string;
      completedDate: string;
      totalTests: number;
      passed: number;
      failed: number;
      skipped: number;
      results: AzureTestResult[];
    }[] = [];

    // For each build, get associated test runs and results
    for (const build of builds) {
      try {
        const testRuns = await this.getTestRunsForBuild(project, build.id);
        if (!testRuns.length) continue;

        let totalTests = 0;
        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const allResults: AzureTestResult[] = [];

        for (const run of testRuns) {
          totalTests += run.totalTests;
          passed += run.passedTests;
          failed += run.failedTests;
          skipped += run.notApplicableTests;

          const results = await this.getTestResults(project, run.id);
          allResults.push(...results);
        }

        pipelineResults.push({
          pipelineName: build.definition.name,
          definitionId: build.definition.id,
          buildId: build.id,
          buildNumber: build.buildNumber,
          completedDate: build.finishTime || build.startTime,
          totalTests,
          passed,
          failed,
          skipped,
          results: allResults,
        });
      } catch (err) {
        console.warn(`Failed to get test runs for build ${build.id}:`, err);
      }
    }

    return pipelineResults;
  }

  /**
   * Pipeline-centric: Transform pipeline test results into ProjectData format
   * Each project's pipelines become "modules" in the dashboard
   */
  async getProjectDataFromPipelines(
    projectName: string,
    _environment: Environment,
    date: Date
  ): Promise<ProjectData | null> {
    try {
      const pipelineResults = await this.getTestResultsByPipelines(projectName, date);

      if (!pipelineResults.length) {
        return {
          projectId: `proj-${projectName}`,
          projectName,
          modules: [],
          totalTests: 0,
          executed: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
          automatedTests: 0,
          manualTests: 0,
          automated: buildBreakdown(0, 0, 0, 0),
          manual: buildBreakdown(0, 0, 0, 0),
        };
      }

      // Each pipeline becomes a module
      const modules: ModuleTestResult[] = pipelineResults.map(pr => {
        // Classify automated vs manual by checking automatedTestName field
        const autoCount = pr.results.filter(r => r.automatedTestName).length;
        const manualCount = pr.results.length - autoCount;
        const autoPassed = pr.results.filter(r => r.automatedTestName && r.outcome === 'Passed').length;
        const autoFailed = pr.results.filter(r => r.automatedTestName && r.outcome === 'Failed').length;
        const autoSkipped = autoCount - autoPassed - autoFailed;
        const manualPassed = pr.results.filter(r => !r.automatedTestName && r.outcome === 'Passed').length;
        return {
          moduleId: `pipeline-${pr.definitionId}`,
          moduleName: pr.pipelineName,
          totalTests: pr.totalTests,
          executed: pr.passed + pr.failed,
          passed: pr.passed,
          failed: pr.failed,
          skipped: pr.skipped,
          passRate: (pr.passed + pr.failed) > 0
            ? (pr.passed / (pr.passed + pr.failed)) * 100
            : 0,
          automatedTests: automated || pr.totalTests, // Pipeline runs are typically all automated
          manualTests: manual,
          linkedDefects: [],
          lastRunTime: pr.completedDate,
        };
      });

      const totalTests = modules.reduce((s, m) => s + m.totalTests, 0);
      const totalPassed = modules.reduce((s, m) => s + m.passed, 0);
      const totalFailed = modules.reduce((s, m) => s + m.failed, 0);
      const totalSkipped = modules.reduce((s, m) => s + m.skipped, 0);
      const totalAutomated = modules.reduce((s, m) => s + m.automatedTests, 0);
      const totalManual = modules.reduce((s, m) => s + m.manualTests, 0);
      const executed = totalPassed + totalFailed;

      return {
        projectId: `proj-${projectName}`,
        projectName,
        modules,
        totalTests,
        executed,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        passRate: executed > 0 ? (totalPassed / executed) * 100 : 0,
        automatedTests: totalAutomated,
        manualTests: totalManual,
        automated: buildBreakdown(totalAutomated, modules.reduce((s, m) => s + m.automated.passed, 0), modules.reduce((s, m) => s + m.automated.failed, 0), modules.reduce((s, m) => s + m.automated.skipped, 0)),
        manual: buildBreakdown(totalManual, modules.reduce((s, m) => s + m.manual.passed, 0), modules.reduce((s, m) => s + m.manual.failed, 0), modules.reduce((s, m) => s + m.manual.skipped, 0)),
        lastRunTime: pipelineResults[0]?.completedDate,
        runCount: pipelineResults.length,
      };
    } catch (error) {
      console.error(`Failed to fetch pipeline data for project ${projectName}:`, error);
      return null;
    }
  }

  /**
   * Get area paths for a project (used as modules)
   */
  async getAreaPaths(project: string): Promise<string[]> {
    const url = this.buildUrl(project, 'wit/classificationnodes/areas', { $depth: '2' });
    const response = await this.request<{ children?: { name: string }[] }>(url);
    return response.children?.map(c => c.name) || [];
  }

  /**
   * Transform Azure DevOps data to dashboard format
   */
  async getProjectData(projectName: string, _environment: Environment): Promise<ProjectData | null> {
    try {
      const [testRuns, areaPaths, defects] = await Promise.all([
        this.getTestRuns(projectName),
        this.getAreaPaths(projectName),
        this.getDefects(projectName),
      ]);

      // Group test runs by area path (module)
      const moduleMap = new Map<string, ModuleTestResult>();

      // Initialize modules from area paths
      areaPaths.forEach(areaPath => {
        moduleMap.set(areaPath, {
          moduleId: `mod-${areaPath}`,
          moduleName: areaPath,
          totalTests: 0,
          executed: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          passRate: 0,
          automatedTests: 0,
          manualTests: 0,
          automated: buildBreakdown(0, 0, 0, 0),
          manual: buildBreakdown(0, 0, 0, 0),
          linkedDefects: [],
        });
      });

      // Aggregate test results and classify automated vs manual
      let totalTests = 0;
      let totalPassed = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      let totalAutomated = 0;
      let totalManual = 0;

      for (const run of testRuns) {
        totalTests += run.totalTests;
        totalPassed += run.passedTests;
        totalFailed += run.failedTests;
        totalSkipped += run.notApplicableTests;
        // Azure DevOps Test Runs have an isAutomated flag
        if (run.isAutomated) {
          totalAutomated += run.totalTests;
        } else {
          totalManual += run.totalTests;
        }
      }

      // Map defects to modules based on area path
      defects.forEach(defect => {
        const areaPath = defect.fields['System.AreaPath'].split('\\').pop() || '';
        const module = moduleMap.get(areaPath);
        if (module) {
          module.linkedDefects.push(defect.id.toString());
        }
      });

      // Calculate pass rates for modules
      const modules = Array.from(moduleMap.values()).map(module => ({
        ...module,
        passRate: module.executed > 0 ? (module.passed / module.executed) * 100 : 0,
      }));

      const executed = totalTests;
      const passRate = executed > 0 ? (totalPassed / executed) * 100 : 0;

      return {
        projectId: `proj-${projectName}`,
        projectName,
        modules,
        totalTests,
        executed,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        passRate,
        automatedTests: totalAutomated,
        manualTests: totalManual,
        automated: buildBreakdown(totalAutomated, totalPassed, totalFailed, totalSkipped),
        manual: buildBreakdown(totalManual, 0, 0, 0),
      };
    } catch (error) {
      console.error(`Failed to fetch data for project ${projectName}:`, error);
      return null;
    }
  }

  /**
   * Transform defects to dashboard format
   */
  transformDefects(azureDefects: AzureWorkItem[], environment: Environment): Defect[] {
    return azureDefects.map(wi => {
      const severityMap: Record<string, Defect['severity']> = {
        '1 - Critical': 'critical',
        '2 - High': 'major',
        '3 - Medium': 'minor',
        '4 - Low': 'trivial',
      };

      const statusMap: Record<string, Defect['status']> = {
        'New': 'open',
        'Active': 'open',
        'In Progress': 'in-progress',
        'Resolved': 'resolved',
        'Closed': 'closed',
      };

      return {
        id: `DEF-${wi.id}`,
        title: wi.fields['System.Title'],
        severity: severityMap[wi.fields['Microsoft.VSTS.Common.Severity'] || ''] || 'minor',
        status: statusMap[wi.fields['System.State']] || 'open',
        assignee: wi.fields['System.AssignedTo']?.displayName || 'Unassigned',
        createdDate: wi.fields['System.CreatedDate'],
        environment,
        linkedTestIds: [],
        workItemUrl: `${this.baseUrl}/${this.organization}/_workitems/edit/${wi.id}`,
      };
    });
  }
}

/**
 * Check if Azure DevOps is configured
 */
export function isAzureDevOpsConfigured(config: AzureDevOpsConfig): boolean {
  return Boolean(config.organization && config.personalAccessToken);
}

/**
 * Create Azure DevOps service instance
 */
export function createAzureDevOpsService(config: AzureDevOpsConfig): AzureDevOpsService | null {
  if (!isAzureDevOpsConfigured(config)) {
    return null;
  }
  return new AzureDevOpsService(config);
}

