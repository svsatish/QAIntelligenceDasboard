import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User Role Types
export type UserRole = 'admin' | 'lead' | 'viewer';

export interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  projectAccess: string[]; // Project IDs user can access (empty = all)
}

export interface RBACConfig {
  enabled: boolean;
  adminEmails: string[]; // Users with admin role
  leadEmails: string[];  // Users with lead role (can edit settings)
  // Everyone else is a viewer (read-only)
}

// Types for Azure DevOps configuration
export interface AzureDevOpsConfig {
  organization: string;
  personalAccessToken: string;
  baseUrl: string;
}

export interface ProjectConfig {
  id: string;
  name: string;
  enabled: boolean;
  pipelines: PipelineConfig[];
}

export interface PipelineConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'build' | 'release' | 'test';
}

export interface DashboardSettings {
  refreshInterval: number; // in seconds, 0 = manual only
  defaultEnvironment: 'QA' | 'Stage' | 'UAT' | 'Prod';
  showNotifications: boolean;
  autoExpandProjects: boolean;
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
  compactView: boolean;
}

export interface BrandingSettings {
  dashboardName: string;
  companyLogo: string; // Base64 encoded image or URL
  logoFileName: string;
}

export interface EnvironmentConfig {
  id: string;
  name: string;
  color: string;
  order: number;
  isProduction: boolean;
  enabled: boolean;
}

export const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  { id: 'qa', name: 'QA', color: '#8B5CF6', order: 1, isProduction: false, enabled: true },
  { id: 'stage', name: 'Stage', color: '#3B82F6', order: 2, isProduction: false, enabled: true },
  { id: 'uat', name: 'UAT', color: '#F97316', order: 3, isProduction: false, enabled: true },
  { id: 'prod', name: 'Prod', color: '#22C55E', order: 4, isProduction: true, enabled: true },
];

export interface NotificationSettings {
  enableCriticalAlerts: boolean;
  enableFailureNotifications: boolean;
  emailNotifications: boolean;
  emailRecipients: string[];
  slackWebhook: string;
  teamsWebhook: string;
}

export interface Settings {
  azureDevOps: AzureDevOpsConfig;
  projects: ProjectConfig[];
  dashboard: DashboardSettings;
  branding: BrandingSettings;
  environments: EnvironmentConfig[];
  notifications: NotificationSettings;
  rbac: RBACConfig;
  lastUpdated: string;
}

const defaultSettings: Settings = {
  azureDevOps: {
    organization: '',
    personalAccessToken: '',
    baseUrl: 'https://dev.azure.com',
  },
  projects: [],
  dashboard: {
    refreshInterval: 300, // 5 minutes
    defaultEnvironment: 'Stage',
    showNotifications: true,
    autoExpandProjects: false,
    dateFormat: 'MM/dd/yyyy',
    compactView: true,
  },
  branding: {
    dashboardName: 'Test Automation Dashboard',
    companyLogo: '',
    logoFileName: '',
  },
  environments: DEFAULT_ENVIRONMENTS,
  notifications: {
    enableCriticalAlerts: true,
    enableFailureNotifications: true,
    emailNotifications: false,
    emailRecipients: [],
    slackWebhook: '',
    teamsWebhook: '',
  },
  rbac: {
    enabled: false, // Set to true when Azure AD is configured
    adminEmails: [], // Add admin emails here
    leadEmails: [],  // Add lead emails here
  },
  lastUpdated: new Date().toISOString(),
};

// Mock current user - in production, this comes from Azure AD
const MOCK_CURRENT_USER: UserInfo = {
  id: 'user-001',
  email: 'admin@example.com', // Change to test different roles
  displayName: 'Admin User',
  role: 'admin', // Default to admin for demo
  projectAccess: [],
};

interface SettingsContextType {
  settings: Settings;
  currentUser: UserInfo;
  userRole: UserRole;
  canEditSettings: boolean;
  canCreateDefects: boolean;
  canExportReports: boolean;
  updateSettings: (newSettings: Partial<Settings>) => void;
  updateAzureDevOpsConfig: (config: Partial<AzureDevOpsConfig>) => void;
  updateDashboardSettings: (settings: Partial<DashboardSettings>) => void;
  updateBrandingSettings: (settings: Partial<BrandingSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateRBACConfig: (config: Partial<RBACConfig>) => void;
  // Environment management
  addEnvironment: (env: EnvironmentConfig) => void;
  updateEnvironment: (envId: string, updates: Partial<EnvironmentConfig>) => void;
  removeEnvironment: (envId: string) => void;
  reorderEnvironments: (environments: EnvironmentConfig[]) => void;
  resetEnvironments: () => void;
  getEnabledEnvironments: () => EnvironmentConfig[];
  // Project management
  addProject: (project: ProjectConfig) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<ProjectConfig>) => void;
  toggleProjectEnabled: (projectId: string) => void;
  togglePipelineEnabled: (projectId: string, pipelineId: string) => void;
  resetSettings: () => void;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'test-automation-dashboard-settings';
const SETTINGS_VERSION = '2.0'; // Increment this when settings structure changes

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedVersion = localStorage.getItem(`${STORAGE_KEY}-version`);

    // If version mismatch, clear old settings
    if (storedVersion !== SETTINGS_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(`${STORAGE_KEY}-version`, SETTINGS_VERSION);
      return defaultSettings;
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Deep merge to ensure new properties are included
        return {
          ...defaultSettings,
          ...parsed,
          azureDevOps: { ...defaultSettings.azureDevOps, ...parsed.azureDevOps },
          dashboard: { ...defaultSettings.dashboard, ...parsed.dashboard },
          branding: { ...defaultSettings.branding, ...parsed.branding },
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          rbac: { ...defaultSettings.rbac, ...parsed.rbac },
          environments: parsed.environments || defaultSettings.environments,
          projects: parsed.projects || defaultSettings.projects,
        };
      } catch {
        return defaultSettings;
      }
    }

    // First time - save version
    localStorage.setItem(`${STORAGE_KEY}-version`, SETTINGS_VERSION);
    return defaultSettings;
  });

  // Current user - in production, fetch from Azure AD
  const [currentUser] = useState<UserInfo>(MOCK_CURRENT_USER);

  // Determine user role based on RBAC config
  const getUserRole = (): UserRole => {
    const rbac = settings.rbac || defaultSettings.rbac;

    // If RBAC is disabled, everyone is admin (for demo/development)
    if (!rbac.enabled) {
      return 'admin';
    }

    const userEmail = currentUser.email.toLowerCase();

    // Check admin list
    if ((rbac.adminEmails || []).map(e => e.toLowerCase()).includes(userEmail)) {
      return 'admin';
    }

    // Check lead list
    if ((rbac.leadEmails || []).map(e => e.toLowerCase()).includes(userEmail)) {
      return 'lead';
    }

    // Default to viewer
    return 'viewer';
  };

  const userRole = getUserRole();

  // Permission checks
  const canEditSettings = userRole === 'admin' || userRole === 'lead';
  const canCreateDefects = userRole === 'admin' || userRole === 'lead';
  const canExportReports = true; // All users can export

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Helper to check permissions before updating
  const checkWritePermission = (action: string): boolean => {
    if (!canEditSettings) {
      console.warn(`Permission denied: ${action} requires admin or lead role`);
      return false;
    }
    return true;
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    if (!checkWritePermission('updateSettings')) return;
    setSettings(prev => ({
      ...prev,
      ...newSettings,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateAzureDevOpsConfig = (config: Partial<AzureDevOpsConfig>) => {
    if (!checkWritePermission('updateAzureDevOpsConfig')) return;
    setSettings(prev => ({
      ...prev,
      azureDevOps: { ...prev.azureDevOps, ...config },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateDashboardSettings = (dashboardSettings: Partial<DashboardSettings>) => {
    if (!checkWritePermission('updateDashboardSettings')) return;
    setSettings(prev => ({
      ...prev,
      dashboard: { ...prev.dashboard, ...dashboardSettings },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateBrandingSettings = (brandingSettings: Partial<BrandingSettings>) => {
    if (!checkWritePermission('updateBrandingSettings')) return;
    setSettings(prev => ({
      ...prev,
      branding: { ...prev.branding, ...brandingSettings },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateNotificationSettings = (notificationSettings: Partial<NotificationSettings>) => {
    if (!checkWritePermission('updateNotificationSettings')) return;
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, ...notificationSettings },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateRBACConfig = (rbacConfig: Partial<RBACConfig>) => {
    // Only admins can modify RBAC
    if (userRole !== 'admin') {
      console.warn('Permission denied: Only admins can modify RBAC settings');
      return;
    }
    setSettings(prev => ({
      ...prev,
      rbac: { ...prev.rbac, ...rbacConfig },
      lastUpdated: new Date().toISOString(),
    }));
  };

  const addProject = (project: ProjectConfig) => {
    if (!checkWritePermission('addProject')) return;
    setSettings(prev => ({
      ...prev,
      projects: [...prev.projects, project],
      lastUpdated: new Date().toISOString(),
    }));
  };

  const removeProject = (projectId: string) => {
    if (!checkWritePermission('removeProject')) return;
    setSettings(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateProject = (projectId: string, updates: Partial<ProjectConfig>) => {
    if (!checkWritePermission('updateProject')) return;
    setSettings(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const toggleProjectEnabled = (projectId: string) => {
    if (!checkWritePermission('toggleProjectEnabled')) return;
    setSettings(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId ? { ...p, enabled: !p.enabled } : p
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const togglePipelineEnabled = (projectId: string, pipelineId: string) => {
    if (!checkWritePermission('togglePipelineEnabled')) return;
    setSettings(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              pipelines: p.pipelines.map(pl =>
                pl.id === pipelineId ? { ...pl, enabled: !pl.enabled } : pl
              )
            }
          : p
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  // Environment management functions
  const addEnvironment = (env: EnvironmentConfig) => {
    if (!checkWritePermission('addEnvironment')) return;
    setSettings(prev => ({
      ...prev,
      environments: [...prev.environments, env],
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateEnvironment = (envId: string, updates: Partial<EnvironmentConfig>) => {
    if (!checkWritePermission('updateEnvironment')) return;
    setSettings(prev => ({
      ...prev,
      environments: prev.environments.map(e =>
        e.id === envId ? { ...e, ...updates } : e
      ),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const removeEnvironment = (envId: string) => {
    if (!checkWritePermission('removeEnvironment')) return;
    setSettings(prev => ({
      ...prev,
      environments: prev.environments.filter(e => e.id !== envId),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const reorderEnvironments = (environments: EnvironmentConfig[]) => {
    if (!checkWritePermission('reorderEnvironments')) return;
    setSettings(prev => ({
      ...prev,
      environments: environments.map((e, index) => ({ ...e, order: index + 1 })),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const resetEnvironments = () => {
    if (!checkWritePermission('resetEnvironments')) return;
    setSettings(prev => ({
      ...prev,
      environments: DEFAULT_ENVIRONMENTS,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const getEnabledEnvironments = () => {
    return (settings.environments || DEFAULT_ENVIRONMENTS)
      .filter(e => e.enabled)
      .sort((a, b) => a.order - b.order);
  };

  const resetSettings = () => {
    if (userRole !== 'admin') {
      console.warn('Permission denied: Only admins can reset all settings');
      return;
    }
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  const isConfigured = Boolean(
    settings.azureDevOps.organization &&
    settings.azureDevOps.personalAccessToken
  );

  return (
    <SettingsContext.Provider value={{
      settings,
      currentUser,
      userRole,
      canEditSettings,
      canCreateDefects,
      canExportReports,
      updateSettings,
      updateAzureDevOpsConfig,
      updateDashboardSettings,
      updateBrandingSettings,
      updateNotificationSettings,
      updateRBACConfig,
      addEnvironment,
      updateEnvironment,
      removeEnvironment,
      reorderEnvironments,
      resetEnvironments,
      getEnabledEnvironments,
      addProject,
      removeProject,
      updateProject,
      toggleProjectEnabled,
      togglePipelineEnabled,
      resetSettings,
      isConfigured,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

