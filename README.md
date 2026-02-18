# QA Intelligence Dashboard

A modern, real-time test automation dashboard that integrates with Azure DevOps to provide comprehensive visibility into your test results, defects, and quality metrics across multiple projects and environments.

## 🚀 Features

### Core Features
- **Multi-Project Support**: View test results across multiple Azure DevOps projects in a single dashboard
- **Hierarchical View**: Projects → Modules → Test Suites → Test Results
- **Environment Filtering**: Switch between QA, Stage, UAT, and Production environments
- **Date-Based Analysis**: Compare today's results with historical data
- **Real-Time Updates**: Auto-refresh capabilities with configurable intervals

### Test Analytics
- **Pass/Fail Metrics**: Total tests, executed, passed, failed, skipped counts
- **Pass Rate Tracking**: Color-coded pass rates with trend indicators
- **Trend Analysis**: Historical pass/fail rate visualization
- **Comparison View**: Current vs. previous cycle comparisons

### Defect Management
- **Defect Tracking**: View and manage defects linked to test failures
- **Traceability**: Link test failures to defects with full traceability
- **Create Defects**: Create Azure DevOps bugs directly from failed tests
- **Severity Classification**: Critical, Major, Minor, Trivial categorization

### User Experience
- **Dark/Light Theme**: Full dark mode support with system preference detection
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **PDF Export**: Export dashboard reports as PDF documents
- **Clickable Metrics**: All numbers link directly to Azure DevOps

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Framework | 18.x |
| **TypeScript** | Type Safety | 5.x |
| **Vite** | Build Tool & Dev Server | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Recharts** | Charts & Visualizations | 2.x |
| **Lucide React** | Icons | Latest |
| **date-fns** | Date Manipulation | 2.x |
| **jsPDF** | PDF Generation | 2.x |
| **html2canvas** | Screenshot for PDF | 1.x |

### Why These Technologies?

- **React + TypeScript**: Type-safe component development with excellent DX
- **Vite**: Lightning-fast HMR and optimized production builds
- **Tailwind CSS**: Utility-first CSS for rapid, consistent styling
- **Recharts**: React-native charting with great customization

---

## 📊 Benefits Over Azure DevOps Dashboard

| Feature | This Dashboard | Azure DevOps Dashboard |
|---------|---------------|----------------------|
| **Multi-Project View** | ✅ Single view for all projects | ❌ One project at a time |
| **Cross-Environment** | ✅ QA/Stage/UAT/Prod toggle | ❌ Limited environment support |
| **Real-Time Updates** | ✅ Configurable auto-refresh | ⚠️ Manual refresh required |
| **Dark Mode** | ✅ Full dark theme support | ❌ Light mode only |
| **Custom Metrics** | ✅ Tailored for QA teams | ⚠️ Generic widgets |
| **One-Click Defect Creation** | ✅ Pre-filled bug templates | ❌ Manual navigation |
| **Trend Comparison** | ✅ Today vs selected date | ⚠️ Limited comparison |
| **PDF Export** | ✅ One-click export | ❌ Not available |
| **Mobile Responsive** | ✅ Full mobile support | ⚠️ Limited responsiveness |
| **Load Time** | ✅ <2s initial load | ⚠️ 5-10s with widgets |

---

## 📈 Benefits Over Power BI Dashboards

| Feature | This Dashboard | Power BI |
|---------|---------------|----------|
| **Setup Time** | ✅ Minutes | ❌ Hours/Days |
| **Cost** | ✅ Free (self-hosted) | ❌ Pro license required |
| **Real-Time Data** | ✅ Live API calls | ⚠️ Scheduled refresh |
| **Customization** | ✅ Full code access | ⚠️ DAX/M complexity |
| **Actions** | ✅ Create defects, links | ❌ Read-only |
| **Deployment** | ✅ Static hosting | ❌ Power BI Service |
| **Learning Curve** | ✅ React/Web skills | ❌ Power BI specific |
| **Offline Support** | ✅ PWA capable | ❌ Requires connection |
| **Version Control** | ✅ Git-based | ⚠️ Limited |
| **CI/CD Integration** | ✅ Standard pipelines | ⚠️ Complex setup |

---

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Azure DevOps organization (for real data)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/test-automation-dashboard.git
cd test-automation-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## ⚙️ Configuration

### Azure DevOps Integration

1. Click the **⚙️ Settings** icon in the dashboard header
2. Enter your Azure DevOps details:
   - **Organization Name**: Your Azure DevOps org
   - **Personal Access Token**: PAT with required permissions
   - **Base URL**: `https://dev.azure.com` (default)
3. Click **Test Connection** to verify
4. Click **Save Configuration**

See [ONBOARDING.md](ONBOARDING.md) for detailed integration instructions.

### Environment Variables (Optional)

Create a `.env` file for default configuration:

```env
VITE_AZDO_ORGANIZATION=your-organization
VITE_AZDO_BASE_URL=https://dev.azure.com
```

---

## 📁 Project Structure

```
test-automation-dashboard/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts
│   ├── components/
│   │   └── dashboard/     # Dashboard components
│   │       ├── ActivityFeed.tsx
│   │       ├── AlertSystem.tsx
│   │       ├── ComparisonView.tsx
│   │       ├── CreateDefectModal.tsx
│   │       ├── DashboardHeader.tsx
│   │       ├── DefectsTraceability.tsx
│   │       ├── ProjectModuleOverview.tsx
│   │       ├── SettingsModal.tsx
│   │       └── TrendAnalysis.tsx
│   ├── context/           # React Context providers
│   │   ├── SettingsContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/          # API and data services
│   │   └── mockData.ts    # Mock data generators
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── ONBOARDING.md          # Integration guide
├── README.md              # This file
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🔌 API Integration

### Implementing Real Data Fetching

Replace mock data with real API calls by creating a service:

```typescript
// src/services/azureDevOpsService.ts
export class AzureDevOpsService {
  private baseUrl: string;
  private organization: string;
  private token: string;

  constructor(config: AzureDevOpsConfig) {
    this.baseUrl = config.baseUrl;
    this.organization = config.organization;
    this.token = config.personalAccessToken;
  }

  private get headers() {
    return {
      'Authorization': `Basic ${btoa(':' + this.token)}`,
      'Content-Type': 'application/json'
    };
  }

  async getTestRuns(project: string, fromDate: Date): Promise<TestRun[]> {
    const response = await fetch(
      `${this.baseUrl}/${this.organization}/${project}/_apis/test/runs?minLastUpdatedDate=${fromDate.toISOString()}&api-version=7.0`,
      { headers: this.headers }
    );
    return response.json();
  }

  async getDefects(project: string): Promise<Defect[]> {
    const query = {
      query: "SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.State] <> 'Closed'"
    };
    
    const response = await fetch(
      `${this.baseUrl}/${this.organization}/${project}/_apis/wit/wiql?api-version=7.0`,
      { 
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(query)
      }
    );
    return response.json();
  }
}
```

### Conditional Data Loading

The dashboard automatically uses mock data when Azure DevOps is not configured:

```typescript
const { isConfigured, settings } = useSettings();

const fetchData = async () => {
  if (isConfigured) {
    // Fetch from Azure DevOps API
    const service = new AzureDevOpsService(settings.azureDevOps);
    return await service.getTestRuns(project, date);
  } else {
    // Use mock data for demo
    return getMockTestRuns(project, date);
  }
};
```

---

## 🎨 Customization

### Adding New Environments

Edit `src/services/mockData.ts`:

```typescript
export type Environment = 'QA' | 'Stage' | 'UAT' | 'Prod' | 'Dev';
export const ENVIRONMENTS: Environment[] = ['Dev', 'QA', 'Stage', 'UAT', 'Prod'];
```

### Custom Theme Colors

Edit `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... your custom palette
        }
      }
    }
  }
}
```

### Adding New Widgets

Create a new component in `src/components/dashboard/`:

```typescript
// src/components/dashboard/MyWidget.tsx
import React from 'react';

const MyWidget: React.FC<MyWidgetProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        My Widget
      </h3>
      {/* Widget content */}
    </div>
  );
};

export default MyWidget;
```

---

## 🚢 Deployment

### Static Hosting (Recommended)

Build and deploy to any static hosting provider:

```bash
npm run build
# Deploy 'dist' folder to:
# - Azure Static Web Apps (recommended for Azure DevOps users)
# - Azure Blob Storage Static Website
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3 + CloudFront
```

### Azure Static Web Apps (Recommended for Azure DevOps)

Azure Static Web Apps is the easiest way to host this dashboard if you're already using Azure DevOps.

#### Option 1: Azure Pipelines (azure-pipelines.yml)

Create `azure-pipelines.yml` in your repository root:

```yaml
# Azure Pipelines - Deploy to Azure Static Web Apps
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'

  - script: |
      npm ci
      npm run build
    displayName: 'Install dependencies and build'

  - task: AzureStaticWebApp@0
    inputs:
      app_location: '/'
      output_location: 'dist'
      azure_static_web_apps_api_token: $(AZURE_STATIC_WEB_APPS_API_TOKEN)
    displayName: 'Deploy to Azure Static Web Apps'
```

**Setup Steps:**
1. Create an Azure Static Web App in Azure Portal
2. Copy the deployment token
3. In Azure DevOps, go to **Pipelines** → **Library** → **Variable groups**
4. Add variable `AZURE_STATIC_WEB_APPS_API_TOKEN` with the token value
5. Create a new pipeline using the YAML file above

#### Option 2: Azure Blob Storage Static Website

For simpler hosting without Azure Static Web Apps:

```yaml
# azure-pipelines.yml - Deploy to Azure Blob Storage
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  storageAccount: 'yourstorageaccount'
  containerName: '$web'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'

  - script: |
      npm ci
      npm run build
    displayName: 'Build'

  - task: AzureCLI@2
    inputs:
      azureSubscription: 'Your-Azure-Service-Connection'
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        az storage blob upload-batch \
          --account-name $(storageAccount) \
          --destination $(containerName) \
          --source dist \
          --overwrite
    displayName: 'Deploy to Azure Blob Storage'
```

**Setup Steps:**
1. Create a Storage Account in Azure Portal
2. Enable **Static website** in Storage Account settings
3. Note the primary endpoint URL (your dashboard URL)
4. Create an Azure Service Connection in Azure DevOps
5. Update the pipeline variables

#### Option 3: Azure App Service (Linux)

For more control and custom domains:

```yaml
# azure-pipelines.yml - Deploy to Azure App Service
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'

  - script: |
      npm ci
      npm run build
    displayName: 'Build'

  - task: ArchiveFiles@2
    inputs:
      rootFolderOrFile: 'dist'
      includeRootFolder: false
      archiveType: 'zip'
      archiveFile: '$(Build.ArtifactStagingDirectory)/dist.zip'

  - task: AzureWebApp@1
    inputs:
      azureSubscription: 'Your-Azure-Service-Connection'
      appType: 'webAppLinux'
      appName: 'your-app-service-name'
      package: '$(Build.ArtifactStagingDirectory)/dist.zip'
      runtimeStack: 'NODE|18-lts'
    displayName: 'Deploy to Azure App Service'
```

### GitHub Actions (for GitHub repositories)

```yaml
# .github/workflows/azure-static-web-apps.yml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install and Build
        run: |
          npm ci
          npm run build
      
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "upload"
          app_location: "/"
          output_location: "dist"
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t test-dashboard .
docker run -p 8080:80 test-dashboard
```

### Deployment Comparison

| Platform | Best For | Setup Complexity | Cost |
|----------|----------|------------------|------|
| **Azure Static Web Apps** | Azure DevOps users | Easy | Free tier available |
| **Azure Blob Storage** | Simple static hosting | Easy | Very low |
| **Azure App Service** | Custom domains, SSL | Medium | Pay-as-you-go |
| **Docker + Azure Container** | Full control | Medium | Pay-as-you-go |
| **Netlify/Vercel** | Quick deployment | Very Easy | Free tier available |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Azure DevOps REST API](https://docs.microsoft.com/rest/api/azure/devops)
- [Recharts](https://recharts.org/) for beautiful charts
- [Lucide](https://lucide.dev/) for icons
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

## 📞 Support

- **Documentation**: [ONBOARDING.md](ONBOARDING.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/test-automation-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/test-automation-dashboard/discussions)

---

*Built with ❤️ for QA Teams*
