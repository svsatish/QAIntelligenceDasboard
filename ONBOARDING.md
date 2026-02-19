# ONBOARDING

This guide will help you integrate the QA Intelligence Dashboard with your Azure DevOps organization to display real test results, defects, and pipeline data.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Azure DevOps Setup](#azure-devops-setup)
3. [Dashboard Configuration](#dashboard-configuration)
4. [Project Structure](#project-structure)
5. [Pipeline Configuration](#pipeline-configuration)
6. [Data Formats](#data-formats)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before integrating with Azure DevOps, ensure you have:

- [ ] Access to an Azure DevOps organization
- [ ] Permission to create Personal Access Tokens (PAT)
- [ ] Test Plans configured in your Azure DevOps projects
- [ ] Build/Release pipelines with test tasks

---

## Azure DevOps Setup

### Step 1: Create a Personal Access Token (PAT)

1. Navigate to Azure DevOps: `https://dev.azure.com/{your-organization}`
2. Click on your profile icon (top right) → **Personal access tokens**
3. Click **+ New Token**
4. Configure the token:
   - **Name**: `QA Intelligence Dashboard`
   - **Organization**: Select your organization
   - **Expiration**: Choose appropriate duration (recommend 1 year)
   - **Scopes**: Select the following permissions:

| Scope | Permission | Purpose |
|-------|------------|---------|
| **Test Management** | Read | Fetch test plans, runs, and results |
| **Work Items** | Read | Fetch defects and work items |
| **Build** | Read | Fetch build pipeline data |
| **Release** | Read | Fetch release pipeline data |
| **Project and Team** | Read | List projects and teams |

5. Click **Create** and **copy the token immediately** (you won't see it again)

### Step 2: Note Your Organization Details

```
Organization URL: https://dev.azure.com/{organization-name}
Organization Name: {organization-name}
```

---

## Dashboard Configuration

### Step 1: Open Settings

1. Launch the QA Intelligence Dashboard
2. Click the **⚙️ Settings** icon in the header
3. Navigate to the **Azure DevOps** tab

### Step 2: Enter Connection Details

| Field | Value | Example |
|-------|-------|---------|
| Organization Name | Your Azure DevOps org name | `contoso` |
| Personal Access Token | The PAT you created | `xxxxxxxxxxxxxxxxxxxxx` |
| Base URL | Azure DevOps URL | `https://dev.azure.com` |

### Step 3: Test Connection

1. Click **Test Connection**
2. Wait for the connection test to complete
3. You should see ✅ **Connection successful!**
4. Click **Save Configuration**

---

## Project Structure

### Understanding the Hierarchy

The dashboard organizes data in the following hierarchy:

```
Organization
└── Project
    └── Module (Area Path)
        └── Test Suite
            └── Test Case
                └── Test Run
                    └── Test Result
```

### Mapping Azure DevOps to Dashboard

| Dashboard Term | Azure DevOps Equivalent |
|----------------|------------------------|
| Project | Team Project |
| Module | Area Path (first level) |
| Test Suite | Test Suite in Test Plans |
| Test Case | Test Case work item |
| Defect | Bug work item |

### Adding Projects

1. Go to **Settings** → **Projects & Pipelines**
2. Click **+ Add Project**
3. Enter the exact project name as it appears in Azure DevOps
4. The dashboard will automatically create default pipelines

### Configuring Modules

Modules are derived from your Azure DevOps **Area Paths**. Ensure your project has Area Paths configured:

```
Project
├── Module1 (e.g., Authentication)
├── Module2 (e.g., Payment Gateway)
├── Module3 (e.g., Shopping Cart)
└── Module4 (e.g., User Management)
```

To configure Area Paths in Azure DevOps:
1. Go to **Project Settings** → **Boards** → **Project configuration**
2. Under **Areas**, create your module structure

---

## Pipeline Configuration

### Supported Pipeline Types

| Type | Purpose | Azure DevOps Feature |
|------|---------|---------------------|
| `build` | CI/Build pipelines | Azure Pipelines (Build) |
| `test` | Test execution pipelines | Azure Pipelines with test tasks |
| `release` | CD/Deployment pipelines | Azure Pipelines (Release) |

### Expected Pipeline Structure

For the dashboard to fetch test results, your pipelines should include test tasks:

```yaml
# Example Azure Pipeline with Test Tasks
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: UseDotNet@2
    inputs:
      version: '6.x'

  - task: DotNetCoreCLI@2
    displayName: 'Run Tests'
    inputs:
      command: 'test'
      projects: '**/*Tests.csproj'
      arguments: '--logger trx --results-directory $(Build.ArtifactStagingDirectory)/TestResults'

  # IMPORTANT: Publish Test Results for dashboard integration
  - task: PublishTestResults@2
    displayName: 'Publish Test Results'
    inputs:
      testResultsFormat: 'VSTest'  # or 'JUnit', 'NUnit', 'xUnit'
      testResultsFiles: '**/*.trx'
      searchFolder: '$(Build.ArtifactStagingDirectory)/TestResults'
      mergeTestResults: true
      testRunTitle: 'Unit Tests - $(Build.BuildNumber)'
```

### Supported Test Result Formats

| Format | File Extension | Test Framework |
|--------|---------------|----------------|
| VSTest | `.trx` | MSTest, NUnit, xUnit (.NET) |
| JUnit | `.xml` | JUnit, TestNG, pytest |
| NUnit | `.xml` | NUnit |
| xUnit | `.xml` | xUnit |
| CTest | `.xml` | CTest (C++) |

---

## Data Formats

### Test Run Data

The dashboard expects test data in the following structure:

```typescript
interface TestSuite {
  id: string;           // Unique identifier
  name: string;         // Test suite name
  total: number;        // Total test count
  passed: number;       // Passed test count
  failed: number;       // Failed test count
  skipped: number;      // Skipped test count
  duration: number;     // Duration in seconds
  status: 'passed' | 'failed' | 'unstable';
  runDate: string;      // ISO date string
  environment: 'QA' | 'Stage' | 'UAT' | 'Prod';
}
```

### Project Data

```typescript
interface ProjectData {
  projectId: string;
  projectName: string;
  modules: ModuleTestResult[];
  totalTests: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
}

interface ModuleTestResult {
  moduleId: string;
  moduleName: string;    // Maps to Area Path
  totalTests: number;
  executed: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  linkedDefects: string[];  // Bug work item IDs
}
```

### Defect Data

```typescript
interface Defect {
  id: string;           // Work item ID (e.g., "12345")
  title: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assignee: string;
  createdDate: string;
  environment: 'QA' | 'Stage' | 'UAT' | 'Prod';
  linkedTestIds: string[];
}
```

### Environment Mapping

Map your Azure DevOps environments to dashboard environments:

| Dashboard Environment | Azure DevOps Stage/Environment |
|----------------------|-------------------------------|
| QA | `QA`, `Development`, `Dev` |
| Stage | `Stage`, `Staging`, `Pre-Prod` |
| UAT | `UAT`, `User-Acceptance` |
| Prod | `Prod`, `Production`, `Live` |

---

## API Integration

### Azure DevOps REST API Endpoints

The dashboard uses the following Azure DevOps REST API endpoints:

#### Test Runs
```
GET https://dev.azure.com/{organization}/{project}/_apis/test/runs?api-version=7.0
```

#### Test Results
```
GET https://dev.azure.com/{organization}/{project}/_apis/test/runs/{runId}/results?api-version=7.0
```

#### Test Plans
```
GET https://dev.azure.com/{organization}/{project}/_apis/testplan/plans?api-version=7.0
```

#### Work Items (Defects)
```
POST https://dev.azure.com/{organization}/{project}/_apis/wit/wiql?api-version=7.0

Body:
{
  "query": "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.State] <> 'Closed'"
}
```

#### Build Pipelines
```
GET https://dev.azure.com/{organization}/{project}/_apis/build/builds?api-version=7.0
```

### Authentication Header

All API requests require the PAT in the Authorization header:

```
Authorization: Basic {base64(:{PAT})}
```

Example in JavaScript:
```javascript
const headers = {
  'Authorization': `Basic ${btoa(':' + personalAccessToken)}`,
  'Content-Type': 'application/json'
};
```

---

## Switching from Mock Data to Real Data

Once you've configured your Azure DevOps connection, the dashboard automatically switches from mock data to real API data.

### How It Works

1. **Not Configured**: Dashboard displays mock/sample data
2. **Configured**: Dashboard fetches real data from Azure DevOps APIs

### Verifying Real Data Integration

1. Check the Settings → Azure DevOps tab shows ✅ **Connected**
2. The dashboard header will show live data indicators
3. Project names will match your actual Azure DevOps projects
4. Test results will reflect actual pipeline runs

### Fallback Behavior

If API calls fail, the dashboard will:
1. Show an error notification
2. Display last cached data (if available)
3. Retry automatically based on refresh interval settings

---

## Troubleshooting

### Common Issues

#### "Connection Failed" Error

**Causes:**
- Invalid PAT
- PAT expired
- Incorrect organization name
- Network/firewall issues

**Solutions:**
1. Verify the organization name matches exactly
2. Create a new PAT with correct permissions
3. Check if your network allows Azure DevOps API access

#### No Test Data Showing

**Causes:**
- No test runs in the selected date range
- Pipeline not publishing test results
- Wrong project selected

**Solutions:**
1. Verify test runs exist in Azure DevOps Test Plans
2. Ensure pipelines have `PublishTestResults` task
3. Check the correct project is enabled in Settings

#### Defects Not Linking to Tests

**Causes:**
- Work items not linked in Azure DevOps
- Different Area Paths

**Solutions:**
1. Link Bug work items to Test Cases in Azure DevOps
2. Use consistent Area Paths across work items

### Debug Mode

Enable debug logging by opening browser console and running:

```javascript
localStorage.setItem('dashboard-debug', 'true');
```

This will log API requests and responses for troubleshooting.

---

## Support

For additional help:

1. **Azure DevOps Documentation**: [docs.microsoft.com/azure/devops](https://docs.microsoft.com/azure/devops)
2. **API Reference**: [docs.microsoft.com/rest/api/azure/devops](https://docs.microsoft.com/rest/api/azure/devops)
3. **Create an Issue**: Report bugs or request features in the project repository

---

## Quick Start Checklist

- [ ] Created Azure DevOps PAT with required permissions
- [ ] Configured organization in Settings → Azure DevOps
- [ ] Tested connection successfully
- [ ] Added projects in Settings → Projects & Pipelines
- [ ] Verified Area Paths match module structure
- [ ] Configured pipelines with test result publishing
- [ ] Selected appropriate environment and date filters
- [ ] Verified real data is displaying (not mock data)

---

*Last Updated: February 2025*
