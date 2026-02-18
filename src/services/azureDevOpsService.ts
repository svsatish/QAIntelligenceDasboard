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
  TestFailureDefect,
  ProjectData,
  ModuleTestResult,
  Environment
} from './mockData';

export interface AzureDevOpsConfig {
  organization: string;
  personalAccessToken: string;
  baseUrl: string;
}

export interface AzureTestRun {
  id: number;
  name: string;
  state: string;
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
  async getProjectData(projectName: string, environment: Environment): Promise<ProjectData | null> {
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
          linkedDefects: [],
        });
      });

      // Aggregate test results
      let totalTests = 0;
      let totalPassed = 0;
      let totalFailed = 0;
      let totalSkipped = 0;

      for (const run of testRuns) {
        totalTests += run.totalTests;
        totalPassed += run.passedTests;
        totalFailed += run.failedTests;
        totalSkipped += run.notApplicableTests;
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
        jiraLink: `${this.baseUrl}/${this.organization}/_workitems/edit/${wi.id}`,
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

