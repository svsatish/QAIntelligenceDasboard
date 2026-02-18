import { subDays, subHours, format, isSameDay, parseISO } from 'date-fns';

// Environment types - now supports custom environments
export type Environment = string;

// Default environments for backward compatibility
export const ENVIRONMENTS: Environment[] = ['QA', 'Stage', 'UAT', 'Prod'];

// Test Run Interface - represents a single pipeline/job run
export interface TestRun {
  runId: string;
  runName: string;
  pipelineName: string;
  environment: Environment;
  startTime: string;
  endTime: string;
  status: 'completed' | 'running' | 'failed' | 'cancelled';
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  triggeredBy: string;
  buildNumber: string;
}

export interface TestSuite {
  id: string;
  name: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // in seconds
  status: 'passed' | 'failed' | 'unstable';
  runDate: string;
  environment: Environment;
}

export interface TestTrend {
  date: string;
  passRate: number;
  failRate: number;
  totalTests: number;
}

export interface ModuleError {
  name: string;
  errorCount: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
  screenshotUrl?: string;
  environment: Environment;
}

export interface ComparisonData {
  category: string;
  current: number;
  previous: number;
}

// Defect Interfaces
export interface Defect {
  id: string;
  title: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignee: string;
  createdDate: string;
  environment: Environment;
  linkedTestIds: string[];
  jiraLink?: string;
}

export interface TestFailureDefect {
  testId: string;
  testName: string;
  suiteName: string;
  failureReason: string;
  defects: Defect[];
  environment: Environment;
  runDate: string;
}

// Project and Module Interfaces for hierarchical view
export interface ModuleTestResult {
  moduleId: string;
  moduleName: string;
  totalTests: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  linkedDefects: string[]; // Defect IDs
  lastRunTime?: string; // ISO timestamp of last run
  previousRun?: {
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    runTime: string;
  };
}

export interface ProjectData {
  projectId: string;
  projectName: string;
  modules: ModuleTestResult[];
  totalTests: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  lastRunTime?: string; // ISO timestamp of last run
  runCount?: number; // Number of runs today
  previousRun?: {
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
    runTime: string;
  };
}

// Mock Data Generators

const generateTestSuitesForEnvAndDate = (env: Environment, date: Date): TestSuite[] => {
  const dateStr = date.toISOString();
  const envMultiplier = { QA: 1, Stage: 0.95, UAT: 0.9, Prod: 0.98 }[env];

  return [
    { id: `${env}-1-${dateStr}`, name: 'Authentication', total: 150, passed: Math.floor(148 * envMultiplier), failed: 150 - Math.floor(148 * envMultiplier), skipped: 0, duration: 45, status: envMultiplier > 0.95 ? 'passed' : 'failed', runDate: dateStr, environment: env },
    { id: `${env}-2-${dateStr}`, name: 'Checkout Process', total: 85, passed: Math.floor(72 * envMultiplier), failed: 85 - Math.floor(72 * envMultiplier), skipped: 0, duration: 120, status: 'failed', runDate: dateStr, environment: env },
    { id: `${env}-3-${dateStr}`, name: 'User Profile', total: 60, passed: Math.floor(58 * envMultiplier), failed: 60 - Math.floor(58 * envMultiplier) - 1, skipped: 1, duration: 30, status: 'passed', runDate: dateStr, environment: env },
    { id: `${env}-4-${dateStr}`, name: 'Search Functionality', total: 200, passed: Math.floor(195 * envMultiplier), failed: 200 - Math.floor(195 * envMultiplier), skipped: 0, duration: 90, status: 'unstable', runDate: dateStr, environment: env },
    { id: `${env}-5-${dateStr}`, name: 'Admin Dashboard', total: 120, passed: Math.floor(110 * envMultiplier), failed: 120 - Math.floor(110 * envMultiplier), skipped: 0, duration: 150, status: 'failed', runDate: dateStr, environment: env },
  ];
};

export const getTestSuites = (env?: Environment, date?: Date): TestSuite[] => {
  const targetEnv = env || 'Stage';
  const targetDate = date || new Date();
  return generateTestSuitesForEnvAndDate(targetEnv, targetDate);
};

export const getTrendData = (env?: Environment): TestTrend[] => {
  const data: TestTrend[] = [];
  const envVariance = { QA: 5, Stage: 3, UAT: 2, Prod: 1 }[env || 'Stage'];

  for (let i = 14; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const totalTests = 500 + Math.floor(Math.random() * 100);
    const failRate = envVariance + Math.floor(Math.random() * 8); // varies by env
    data.push({
      date: format(date, 'MMM dd'),
      passRate: 100 - failRate,
      failRate: failRate,
      totalTests,
    });
  }
  return data;
};

export const getModuleErrors = (env?: Environment): ModuleError[] => {
  const multiplier = { QA: 1.2, Stage: 1, UAT: 0.8, Prod: 0.5 }[env || 'Stage'];

  return [
    { name: 'Auth Service', errorCount: Math.floor(5 * multiplier), severity: 'low' },
    { name: 'Payment Gateway', errorCount: Math.floor(28 * multiplier), severity: 'critical' },
    { name: 'Inventory API', errorCount: Math.floor(12 * multiplier), severity: 'medium' },
    { name: 'Frontend UI', errorCount: Math.floor(8 * multiplier), severity: 'low' },
    { name: 'Notification Svc', errorCount: Math.floor(15 * multiplier), severity: 'high' },
    { name: 'Reporting Engine', errorCount: Math.floor(3 * multiplier), severity: 'low' },
    { name: 'User Management', errorCount: Math.floor(2 * multiplier), severity: 'low' },
    { name: 'Cart Logic', errorCount: Math.floor(18 * multiplier), severity: 'high' },
  ];
};

export const getActivityFeed = (env?: Environment): ActivityLog[] => {
  const targetEnv = env || 'Stage';
  return [
    { id: '1', timestamp: new Date().toISOString(), action: 'Regression Suite #402', status: 'failure', details: 'Critical failure in Payment Gateway module', screenshotUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=400&q=80', environment: targetEnv },
    { id: '2', timestamp: subDays(new Date(), 0).toISOString(), action: 'Smoke Test #891', status: 'success', details: 'All systems operational', environment: targetEnv },
    { id: '3', timestamp: subDays(new Date(), 0).toISOString(), action: 'API Integration Test', status: 'warning', details: 'High latency detected in Inventory API', environment: targetEnv },
    { id: '4', timestamp: subDays(new Date(), 1).toISOString(), action: 'UI E2E Test', status: 'success', details: 'Frontend components verified', environment: targetEnv },
    { id: '5', timestamp: subDays(new Date(), 1).toISOString(), action: 'Security Scan', status: 'failure', details: 'Vulnerability detected in Auth Service', screenshotUrl: 'https://images.unsplash.com/photo-1563206767-5b1d972d9fb7?auto=format&fit=crop&w=400&q=80', environment: targetEnv },
  ];
};

export const getComparisonData = (env?: Environment): ComparisonData[] => {
  const envBoost = { QA: 0, Stage: 2, UAT: 4, Prod: 6 }[env || 'Stage'];

  return [
    { category: 'Pass Rate (%)', current: 92 + envBoost, previous: 88 + envBoost },
    { category: 'Execution Time (min)', current: 45 - envBoost, previous: 52 - envBoost },
    { category: 'Critical Bugs', current: Math.max(1, 3 - Math.floor(envBoost / 2)), previous: Math.max(2, 8 - Math.floor(envBoost / 2)) },
    { category: 'Code Coverage (%)', current: 78 + envBoost, previous: 75 + envBoost },
  ];
};

// Defect Generators
export const getDefects = (env?: Environment): Defect[] => {
  const targetEnv = env || 'Stage';
  return [
    { id: 'DEF-001', title: 'Payment processing fails for international cards', severity: 'critical', status: 'open', assignee: 'John Smith', createdDate: subDays(new Date(), 2).toISOString(), environment: targetEnv, linkedTestIds: ['TC-201', 'TC-202'], jiraLink: 'https://jira.example.com/DEF-001' },
    { id: 'DEF-002', title: 'Login timeout on slow connections', severity: 'major', status: 'in-progress', assignee: 'Jane Doe', createdDate: subDays(new Date(), 5).toISOString(), environment: targetEnv, linkedTestIds: ['TC-101'], jiraLink: 'https://jira.example.com/DEF-002' },
    { id: 'DEF-003', title: 'Cart total calculation off by 1 cent', severity: 'minor', status: 'resolved', assignee: 'Bob Wilson', createdDate: subDays(new Date(), 10).toISOString(), environment: targetEnv, linkedTestIds: ['TC-301', 'TC-302', 'TC-303'], jiraLink: 'https://jira.example.com/DEF-003' },
    { id: 'DEF-004', title: 'Search results pagination broken', severity: 'major', status: 'open', assignee: 'Alice Brown', createdDate: subDays(new Date(), 1).toISOString(), environment: targetEnv, linkedTestIds: ['TC-401'], jiraLink: 'https://jira.example.com/DEF-004' },
    { id: 'DEF-005', title: 'User avatar not displaying correctly', severity: 'trivial', status: 'closed', assignee: 'Charlie Davis', createdDate: subDays(new Date(), 15).toISOString(), environment: targetEnv, linkedTestIds: ['TC-501'], jiraLink: 'https://jira.example.com/DEF-005' },
    { id: 'DEF-006', title: 'API response time exceeds SLA', severity: 'critical', status: 'in-progress', assignee: 'Diana Lee', createdDate: new Date().toISOString(), environment: targetEnv, linkedTestIds: ['TC-601', 'TC-602'], jiraLink: 'https://jira.example.com/DEF-006' },
  ];
};

export const getTestFailureDefects = (env?: Environment, date?: Date): TestFailureDefect[] => {
  const targetEnv = env || 'Stage';
  const targetDate = date || new Date();
  const defects = getDefects(targetEnv);

  return [
    { testId: 'TC-201', testName: 'Verify international card payment', suiteName: 'Checkout Process', failureReason: 'AssertionError: Expected status 200 but got 500', defects: defects.filter(d => d.linkedTestIds.includes('TC-201')), environment: targetEnv, runDate: targetDate.toISOString() },
    { testId: 'TC-202', testName: 'Verify payment retry mechanism', suiteName: 'Checkout Process', failureReason: 'TimeoutError: Payment gateway not responding', defects: defects.filter(d => d.linkedTestIds.includes('TC-202')), environment: targetEnv, runDate: targetDate.toISOString() },
    { testId: 'TC-101', testName: 'Verify login with valid credentials', suiteName: 'Authentication', failureReason: 'AssertionError: Login timed out after 30 seconds', defects: defects.filter(d => d.linkedTestIds.includes('TC-101')), environment: targetEnv, runDate: targetDate.toISOString() },
    { testId: 'TC-401', testName: 'Verify search pagination', suiteName: 'Search Functionality', failureReason: 'ElementNotFoundError: Next page button not found', defects: defects.filter(d => d.linkedTestIds.includes('TC-401')), environment: targetEnv, runDate: targetDate.toISOString() },
    { testId: 'TC-601', testName: 'Verify API response time', suiteName: 'Admin Dashboard', failureReason: 'AssertionError: Response time 2500ms exceeds 1000ms threshold', defects: defects.filter(d => d.linkedTestIds.includes('TC-601')), environment: targetEnv, runDate: targetDate.toISOString() },
  ];
};

export const getDefectStats = (env?: Environment) => {
  const defects = getDefects(env);
  return {
    total: defects.length,
    open: defects.filter(d => d.status === 'open').length,
    inProgress: defects.filter(d => d.status === 'in-progress').length,
    resolved: defects.filter(d => d.status === 'resolved').length,
    closed: defects.filter(d => d.status === 'closed').length,
    critical: defects.filter(d => d.severity === 'critical').length,
    major: defects.filter(d => d.severity === 'major').length,
    minor: defects.filter(d => d.severity === 'minor').length,
    trivial: defects.filter(d => d.severity === 'trivial').length,
  };
};

// Projects and Modules Data Generator
// Generate mock test runs for a given environment and date
export const getTestRuns = (env?: Environment, date?: Date): TestRun[] => {
  const targetEnv = env || 'Stage';
  const targetDate = date || new Date();
  const today = new Date();
  const isToday = isSameDay(targetDate, today);

  // Generate multiple runs per day to simulate scheduled/custom jobs
  const runsPerDay = isToday ? 5 : 3; // More runs today
  const runs: TestRun[] = [];

  const pipelines = [
    { name: 'Nightly Regression', triggeredBy: 'Scheduled' },
    { name: 'Smoke Tests', triggeredBy: 'Scheduled' },
    { name: 'Integration Tests', triggeredBy: 'CI Pipeline' },
    { name: 'E2E Tests', triggeredBy: 'Manual' },
    { name: 'Performance Tests', triggeredBy: 'Scheduled' },
  ];

  for (let i = 0; i < runsPerDay; i++) {
    const hoursAgo = isToday ? i * 4 : (i * 6) + 24; // Spread runs throughout the day
    const runTime = subHours(isToday ? today : targetDate, hoursAgo);
    const pipeline = pipelines[i % pipelines.length];
    const basePassRate = 85 + Math.random() * 12;
    const totalTests = 450 + Math.floor(Math.random() * 100);
    const passed = Math.floor(totalTests * (basePassRate / 100));
    const failed = Math.floor((totalTests - passed) * 0.7);
    const skipped = totalTests - passed - failed;

    runs.push({
      runId: `run-${targetEnv}-${format(runTime, 'yyyyMMdd-HHmm')}-${i}`,
      runName: `${pipeline.name} #${1000 + i}`,
      pipelineName: pipeline.name,
      environment: targetEnv,
      startTime: runTime.toISOString(),
      endTime: new Date(runTime.getTime() + 30 * 60000).toISOString(), // 30 min duration
      status: 'completed',
      totalTests,
      passed,
      failed,
      skipped,
      passRate: parseFloat(((passed / totalTests) * 100).toFixed(1)),
      triggeredBy: pipeline.triggeredBy,
      buildNumber: `${format(runTime, 'yyyyMMdd')}.${i + 1}`,
    });
  }

  // Sort by most recent first
  return runs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
};

// Get the latest run for comparison
export const getLatestRun = (env?: Environment): TestRun | null => {
  const runs = getTestRuns(env, new Date());
  return runs.length > 0 ? runs[0] : null;
};

// Get the previous run (second most recent)
export const getPreviousRun = (env?: Environment): TestRun | null => {
  const runs = getTestRuns(env, new Date());
  return runs.length > 1 ? runs[1] : null;
};

export const getProjectsData = (env?: Environment, selectedDate?: Date): ProjectData[] => {
  const targetDate = selectedDate || new Date();
  const today = new Date();
  const isToday = isSameDay(targetDate, today);
  const envMultiplier = { QA: 1.1, Stage: 1, UAT: 0.95, Prod: 0.98 }[env || 'Stage'] || 1;

  // Simulate variance between runs
  const runVariance = isToday ? (Math.random() * 0.05) : 0;
  const currentTime = new Date().toISOString();
  const previousRunTime = subHours(new Date(), 4).toISOString();

  const projects: ProjectData[] = [
    {
      projectId: 'PRJ-001',
      projectName: 'E-Commerce Platform',
      modules: [
        { moduleId: 'MOD-001', moduleName: 'Authentication', totalTests: 150, executed: 148, passed: 140, failed: 5, skipped: 3, passRate: 94.6, linkedDefects: ['DEF-002'] },
        { moduleId: 'MOD-002', moduleName: 'Shopping Cart', totalTests: 85, executed: 85, passed: 72, failed: 13, skipped: 0, passRate: 84.7, linkedDefects: ['DEF-003'] },
        { moduleId: 'MOD-003', moduleName: 'Payment Gateway', totalTests: 120, executed: 118, passed: 95, failed: 21, skipped: 2, passRate: 80.5, linkedDefects: ['DEF-001', 'DEF-006'] },
        { moduleId: 'MOD-004', moduleName: 'Order Management', totalTests: 95, executed: 93, passed: 88, failed: 3, skipped: 2, passRate: 94.6, linkedDefects: [] },
      ],
      totalTests: 450,
      executed: 444,
      passed: 395,
      failed: 42,
      skipped: 7,
      passRate: 89.0
    },
    {
      projectId: 'PRJ-002',
      projectName: 'Mobile Banking App',
      modules: [
        { moduleId: 'MOD-005', moduleName: 'User Login', totalTests: 80, executed: 80, passed: 78, failed: 2, skipped: 0, passRate: 97.5, linkedDefects: [] },
        { moduleId: 'MOD-006', moduleName: 'Fund Transfer', totalTests: 110, executed: 108, passed: 100, failed: 6, skipped: 2, passRate: 92.6, linkedDefects: ['DEF-001'] },
        { moduleId: 'MOD-007', moduleName: 'Bill Payment', totalTests: 65, executed: 64, passed: 60, failed: 3, skipped: 1, passRate: 93.8, linkedDefects: [] },
        { moduleId: 'MOD-008', moduleName: 'Account Summary', totalTests: 45, executed: 45, passed: 44, failed: 1, skipped: 0, passRate: 97.8, linkedDefects: [] },
      ],
      totalTests: 300,
      executed: 297,
      passed: 282,
      failed: 12,
      skipped: 3,
      passRate: 94.9
    },
    {
      projectId: 'PRJ-003',
      projectName: 'Customer Portal',
      modules: [
        { moduleId: 'MOD-009', moduleName: 'Dashboard', totalTests: 55, executed: 54, passed: 50, failed: 3, skipped: 1, passRate: 92.6, linkedDefects: ['DEF-006'] },
        { moduleId: 'MOD-010', moduleName: 'Profile Management', totalTests: 40, executed: 40, passed: 38, failed: 2, skipped: 0, passRate: 95.0, linkedDefects: [] },
        { moduleId: 'MOD-011', moduleName: 'Support Tickets', totalTests: 70, executed: 68, passed: 62, failed: 4, skipped: 2, passRate: 91.2, linkedDefects: ['DEF-004'] },
        { moduleId: 'MOD-012', moduleName: 'Notifications', totalTests: 35, executed: 35, passed: 33, failed: 2, skipped: 0, passRate: 94.3, linkedDefects: [] },
      ],
      totalTests: 200,
      executed: 197,
      passed: 183,
      failed: 11,
      skipped: 3,
      passRate: 92.9
    },
    {
      projectId: 'PRJ-004',
      projectName: 'Admin Console',
      modules: [
        { moduleId: 'MOD-013', moduleName: 'User Management', totalTests: 90, executed: 88, passed: 82, failed: 4, skipped: 2, passRate: 93.2, linkedDefects: [] },
        { moduleId: 'MOD-014', moduleName: 'Reports & Analytics', totalTests: 75, executed: 73, passed: 68, failed: 3, skipped: 2, passRate: 93.2, linkedDefects: [] },
        { moduleId: 'MOD-015', moduleName: 'System Config', totalTests: 50, executed: 50, passed: 47, failed: 3, skipped: 0, passRate: 94.0, linkedDefects: [] },
      ],
      totalTests: 215,
      executed: 211,
      passed: 197,
      failed: 10,
      skipped: 4,
      passRate: 93.4
    },
  ];

  // Apply environment multiplier to simulate different results per environment
  // Add run information and previous run comparison
  const runsToday = isToday ? 5 : 3;

  return projects.map((project, idx) => {
    const currentPassed = Math.floor(project.passed * envMultiplier * (1 + runVariance));
    const currentFailed = Math.floor(project.failed / envMultiplier);
    const currentPassRate = parseFloat(((currentPassed / project.executed) * 100).toFixed(1));

    // Previous run had slightly different results
    const prevVariance = 0.95 + Math.random() * 0.1;
    const previousPassed = Math.floor(project.passed * envMultiplier * prevVariance);
    const previousFailed = Math.floor(project.failed / envMultiplier / prevVariance);
    const previousPassRate = parseFloat(((previousPassed / project.executed) * 100).toFixed(1));

    return {
      ...project,
      passed: currentPassed,
      failed: currentFailed,
      passRate: currentPassRate,
      lastRunTime: subHours(new Date(), idx).toISOString(),
      runCount: runsToday,
      previousRun: {
        passed: previousPassed,
        failed: previousFailed,
        skipped: project.skipped,
        passRate: previousPassRate,
        runTime: subHours(new Date(), idx + 4).toISOString(),
      },
      modules: project.modules.map((module, mIdx) => {
        const modCurrentPassed = Math.floor(module.passed * envMultiplier * (1 + runVariance));
        const modPrevPassed = Math.floor(module.passed * envMultiplier * prevVariance);
        return {
          ...module,
          passed: modCurrentPassed,
          failed: Math.floor(module.failed / envMultiplier),
          passRate: parseFloat(((modCurrentPassed / module.executed) * 100).toFixed(1)),
          lastRunTime: subHours(new Date(), idx + mIdx * 0.5).toISOString(),
          previousRun: {
            passed: modPrevPassed,
            failed: Math.floor(module.failed / envMultiplier / prevVariance),
            skipped: module.skipped,
            passRate: parseFloat(((modPrevPassed / module.executed) * 100).toFixed(1)),
            runTime: subHours(new Date(), idx + mIdx * 0.5 + 4).toISOString(),
          },
        };
      })
    };
  });
};

