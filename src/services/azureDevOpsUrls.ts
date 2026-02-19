/**
 * Azure DevOps URL Builder
 *
 * Builds deep-link URLs for Azure DevOps: work items, test runs, test results, queries.
 * Falls back to '#' when Azure DevOps is not configured (demo mode).
 */

export interface AzDoUrlConfig {
  baseUrl: string;
  organization: string;
}

let _config: AzDoUrlConfig | null = null;

/**
 * Initialize the URL builder with Azure DevOps config.
 * Call this once from SettingsContext or App startup.
 */
export function initAzDoUrls(config: AzDoUrlConfig | null) {
  _config = config;
}

function base(): string {
  if (!_config) return '';
  return `${_config.baseUrl}/${_config.organization}`;
}

/**
 * Work item direct link (defects, bugs, user stories, etc.)
 * URL: {org}/{project}/_workitems/edit/{id}
 */
export function workItemUrl(project: string, workItemId: number | string): string {
  if (!_config) return '#';
  return `${base()}/${encodeURIComponent(project)}/_workitems/edit/${workItemId}`;
}

/**
 * Test runs list for a project
 * URL: {org}/{project}/_testManagement/runs
 */
export function testRunsUrl(project: string): string {
  if (!_config) return '#';
  return `${base()}/${encodeURIComponent(project)}/_testManagement/runs`;
}

/**
 * Specific test run
 * URL: {org}/{project}/_testManagement/runs?runId={runId}
 */
export function testRunUrl(project: string, runId: number | string): string {
  if (!_config) return '#';
  return `${base()}/${encodeURIComponent(project)}/_testManagement/runs?runId=${runId}&_a=resultSummary`;
}

/**
 * Test results query — opens Azure DevOps test results filtered by outcome.
 * Uses the test runs page with query parameters.
 *
 * @param project - Azure DevOps project name
 * @param outcome - 'Passed' | 'Failed' | 'NotExecuted' | 'All'
 * @param isAutomated - true for automated, false for manual, undefined for all
 * @param pipelineName - optional pipeline/module name to scope
 */
export function testResultsQueryUrl(
  project: string,
  outcome?: 'Passed' | 'Failed' | 'NotExecuted' | 'All',
  isAutomated?: boolean,
  pipelineName?: string,
): string {
  if (!_config) return '#';

  // Build a WIQL-style search URL or use the Test Results page
  // Azure DevOps doesn't have a direct deep-link for filtered test results,
  // but we can use the Runs page or build a query URL
  const baseTestUrl = `${base()}/${encodeURIComponent(project)}/_testManagement/runs`;
  const params = new URLSearchParams();
  params.set('_a', 'runQuery');

  if (outcome && outcome !== 'All') {
    params.set('outcomeFilter', outcome);
  }
  if (isAutomated !== undefined) {
    params.set('automatedFilter', isAutomated ? 'true' : 'false');
  }
  if (pipelineName) {
    params.set('runTitle', pipelineName);
  }

  return `${baseTestUrl}?${params.toString()}`;
}

/**
 * Pipeline runs page for a specific pipeline
 * URL: {org}/{project}/_build?definitionId={id}
 */
export function pipelineRunsUrl(project: string, definitionId?: number | string): string {
  if (!_config) return '#';
  const url = `${base()}/${encodeURIComponent(project)}/_build`;
  return definitionId ? `${url}?definitionId=${definitionId}` : url;
}

/**
 * Work items query by type (e.g., all Bugs)
 * URL: {org}/{project}/_queries/query/{wiql}
 */
export function workItemsQueryUrl(project: string, workItemType: string = 'Bug', state?: string): string {
  if (!_config) return '#';
  // WIQL inline queries via URL aren't directly supported, but we can open the Boards backlog
  // filtered by type. Using the work items hub with inline WIQL.
  const wiqlParts = [`[System.WorkItemType] = '${workItemType}'`];
  if (state) {
    wiqlParts.push(`[System.State] = '${state}'`);
  }
  const wiql = encodeURIComponent(`SELECT [System.Id] FROM WorkItems WHERE ${wiqlParts.join(' AND ')} ORDER BY [System.CreatedDate] DESC`);
  return `${base()}/${encodeURIComponent(project)}/_workitems?_a=query&wiql=${wiql}`;
}

/**
 * Boards backlog link
 */
export function boardsUrl(project: string): string {
  if (!_config) return '#';
  return `${base()}/${encodeURIComponent(project)}/_boards/board`;
}

/**
 * Check if Azure DevOps URLs are available (config is set)
 */
export function isAzDoConfigured(): boolean {
  return _config !== null && _config.organization !== '';
}

/**
 * Get the configured org name for display
 */
export function getOrgName(): string {
  return _config?.organization || '';
}

