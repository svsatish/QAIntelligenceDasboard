import React, { useState, useRef } from 'react';
import {
  X, Settings, Cloud, FolderKanban, Bell, Palette,
  Save, RotateCcw, Eye, EyeOff, CheckCircle, AlertCircle,
  Plus, Trash2, ToggleLeft, ToggleRight, Link, TestTube,
  Clock, Calendar, Layout, ChevronDown, ChevronRight, Upload, Image,
  Globe, Star, ArrowUp, ArrowDown, Shield, Lock, Users
} from 'lucide-react';
import { useSettings, ProjectConfig, EnvironmentConfig, DEFAULT_ENVIRONMENTS, UserRole } from '../../context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'branding' | 'environments' | 'azure' | 'projects' | 'dashboard' | 'notifications' | 'access';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    currentUser,
    userRole,
    canEditSettings,
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
    addProject,
    removeProject,
    toggleProjectEnabled,
    togglePipelineEnabled,
    resetSettings,
    isConfigured
  } = useSettings();

  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [showPAT, setShowPAT] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states - with null safety
  const [organization, setOrganization] = useState(settings?.azureDevOps?.organization || '');
  const [pat, setPat] = useState(settings?.azureDevOps?.personalAccessToken || '');
  const [baseUrl, setBaseUrl] = useState(settings?.azureDevOps?.baseUrl || 'https://dev.azure.com');

  // Branding states
  const [dashboardName, setDashboardName] = useState(settings?.branding?.dashboardName || 'QA Intelligence Dashboard');

  // New project form
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);

  // New environment form
  const [showAddEnvironment, setShowAddEnvironment] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvColor, setNewEnvColor] = useState('#6366F1');
  const [newEnvIsProduction, setNewEnvIsProduction] = useState(false);

  // RBAC form states - must be before any early returns
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');

  // Early return if no settings or not open - AFTER all hooks
  if (!settings || !isOpen) return null;

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (PNG, JPG, GIF, SVG, or WebP)');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateBrandingSettings({
          companyLogo: reader.result as string,
          logoFileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    updateBrandingSettings({
      companyLogo: '',
      logoFileName: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveBranding = () => {
    updateBrandingSettings({
      dashboardName: dashboardName.trim() || 'QA Intelligence Dashboard',
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');

    // Simulate API call to test Azure DevOps connection
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would actually call the Azure DevOps API
    if (organization && pat) {
      setConnectionStatus('success');
    } else {
      setConnectionStatus('error');
    }
    setTestingConnection(false);
  };

  const handleSaveAzureConfig = () => {
    updateAzureDevOpsConfig({
      organization,
      personalAccessToken: pat,
      baseUrl,
    });
    setConnectionStatus('idle');
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject: ProjectConfig = {
        id: `proj-${Date.now()}`,
        name: newProjectName.trim(),
        enabled: true,
        pipelines: [
          { id: `pipe-${Date.now()}-1`, name: 'Build Pipeline', enabled: true, type: 'build' },
          { id: `pipe-${Date.now()}-2`, name: 'Test Pipeline', enabled: true, type: 'test' },
        ],
      };
      addProject(newProject);
      setNewProjectName('');
      setShowAddProject(false);
    }
  };

  const handleAddEnvironment = () => {
    if (newEnvName.trim()) {
      const environments = settings.environments || DEFAULT_ENVIRONMENTS;
      const newEnv: EnvironmentConfig = {
        id: `env-${Date.now()}`,
        name: newEnvName.trim(),
        color: newEnvColor,
        order: environments.length + 1,
        isProduction: newEnvIsProduction,
        enabled: true,
      };
      addEnvironment(newEnv);
      setNewEnvName('');
      setNewEnvColor('#6366F1');
      setNewEnvIsProduction(false);
      setShowAddEnvironment(false);
    }
  };

  const moveEnvironment = (envId: string, direction: 'up' | 'down') => {
    const environments = [...(settings.environments || DEFAULT_ENVIRONMENTS)];
    const index = environments.findIndex(e => e.id === envId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= environments.length) return;

    [environments[index], environments[newIndex]] = [environments[newIndex], environments[index]];
    reorderEnvironments(environments);
  };

  const toggleProjectExpanded = (projectId: string) => {
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


  const handleAddAdmin = () => {
    if (newAdminEmail.trim() && !settings.rbac?.adminEmails.includes(newAdminEmail.trim())) {
      updateRBACConfig({
        adminEmails: [...(settings.rbac?.adminEmails || []), newAdminEmail.trim()],
      });
      setNewAdminEmail('');
    }
  };

  const handleRemoveAdmin = (email: string) => {
    updateRBACConfig({
      adminEmails: (settings.rbac?.adminEmails || []).filter(e => e !== email),
    });
  };

  const handleAddLead = () => {
    if (newLeadEmail.trim() && !settings.rbac?.leadEmails.includes(newLeadEmail.trim())) {
      updateRBACConfig({
        leadEmails: [...(settings.rbac?.leadEmails || []), newLeadEmail.trim()],
      });
      setNewLeadEmail('');
    }
  };

  const handleRemoveLead = (email: string) => {
    updateRBACConfig({
      leadEmails: (settings.rbac?.leadEmails || []).filter(e => e !== email),
    });
  };

  // Build tabs list - Access Control only visible to admins
  const allTabs: { id: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'branding', label: 'Branding', icon: <Palette size={18} /> },
    { id: 'environments', label: 'Environments', icon: <Globe size={18} /> },
    { id: 'azure', label: 'Azure DevOps', icon: <Cloud size={18} /> },
    { id: 'projects', label: 'Projects & Pipelines', icon: <FolderKanban size={18} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <Layout size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'access', label: 'Access Control', icon: <Shield size={18} />, adminOnly: true },
  ];

  const tabs = allTabs.filter(tab => !tab.adminOnly || (userRole && userRole === 'admin'));

  const getRoleBadgeColor = (role: UserRole | undefined) => {
    switch (role) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
      case 'lead': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
      case 'viewer': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-2 sm:m-4 flex flex-col sm:flex-row">
        {/* Sidebar - horizontal on mobile, vertical on desktop */}
        <div className="sm:w-56 bg-gray-50 dark:bg-gray-900 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="text-blue-500" size={20} />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          </div>

          {/* Current User Role Badge - hidden on mobile for space */}
          <div className="hidden sm:block mb-6 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Logged in as:</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser?.displayName || 'User'}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${getRoleBadgeColor(userRole)}`}>
                {userRole?.toUpperCase() || 'ADMIN'}
              </span>
              {!canEditSettings && (
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Lock size={10} /> Read-only
                </span>
              )}
            </div>
          </div>

          <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Connection Status - hidden on mobile */}
          <div className="hidden sm:block mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm">
              {isConfigured ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-yellow-500" />
                  <span className="text-yellow-600 dark:text-yellow-400">Not configured</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Read-Only Banner for Viewers */}
            {!canEditSettings && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
                <Lock size={16} className="text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  You have <strong>read-only</strong> access. Contact an administrator to make changes.
                </span>
              </div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Customize Your Dashboard</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Personalize the dashboard with your company's branding and name.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Dashboard Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dashboard Name
                    </label>
                    <input
                      type="text"
                      value={dashboardName}
                      onChange={(e) => setDashboardName(e.target.value)}
                      placeholder="QA Intelligence Dashboard"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This name will appear in the dashboard header
                    </p>
                  </div>

                  {/* Company Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Logo
                    </label>

                    <div className="flex items-start gap-6">
                      {/* Logo Preview */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700 overflow-hidden">
                          {settings.branding.companyLogo ? (
                            <img
                              src={settings.branding.companyLogo}
                              alt="Company Logo"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-center text-gray-400 dark:text-gray-500">
                              <Image size={32} className="mx-auto mb-2" />
                              <span className="text-xs">No logo</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Upload size={16} />
                          Upload Logo
                        </button>

                        {settings.branding.companyLogo && (
                          <button
                            onClick={handleRemoveLogo}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                          >
                            <Trash2 size={16} />
                            Remove Logo
                          </button>
                        )}

                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p><strong>Supported formats:</strong> PNG, JPG, GIF, SVG, WebP</p>
                          <p><strong>Maximum size:</strong> 2MB</p>
                          <p><strong>Recommended:</strong> Square image, at least 128x128px</p>
                        </div>

                        {settings.branding.logoFileName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Current file: <span className="font-medium">{settings.branding.logoFileName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSaveBranding}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Save size={16} />
                    Save Branding
                  </button>
                </div>
              </div>
            )}

            {/* Environments Tab */}
            {activeTab === 'environments' && (
              <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Custom Environments</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Configure the environments available in your dashboard. Reorder, mark production environments, and customize colors.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(settings.environments || DEFAULT_ENVIRONMENTS).length} environments configured
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={resetEnvironments}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <RotateCcw size={14} />
                      Reset to Default
                    </button>
                    <button
                      onClick={() => setShowAddEnvironment(true)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                    >
                      <Plus size={16} />
                      Add Environment
                    </button>
                  </div>
                </div>

                {/* Add Environment Form */}
                {showAddEnvironment && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add New Environment</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Environment Name *
                        </label>
                        <input
                          type="text"
                          value={newEnvName}
                          onChange={(e) => setNewEnvName(e.target.value)}
                          placeholder="e.g., Development, Pre-Prod, DR"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newEnvColor}
                            onChange={(e) => setNewEnvColor(e.target.value)}
                            className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newEnvColor}
                            onChange={(e) => setNewEnvColor(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEnvIsProduction}
                          onChange={(e) => setNewEnvIsProduction(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Mark as Production Environment</span>
                        <Star size={14} className="text-yellow-500" />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddEnvironment}
                        disabled={!newEnvName.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Add Environment
                      </button>
                      <button
                        onClick={() => { setShowAddEnvironment(false); setNewEnvName(''); }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Environments List */}
                <div className="space-y-2">
                  {(settings.environments || DEFAULT_ENVIRONMENTS)
                    .sort((a, b) => a.order - b.order)
                    .map((env, index, arr) => (
                    <div
                      key={env.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      {/* Reorder Controls */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveEnvironment(env.id, 'up')}
                          disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => moveEnvironment(env.id, 'down')}
                          disabled={index === arr.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Color Indicator */}
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: env.color }}
                      />

                      {/* Environment Name */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={env.name}
                          onChange={(e) => updateEnvironment(env.id, { name: e.target.value })}
                          className="w-full px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-500 focus:border-green-500 focus:outline-none text-gray-900 dark:text-white font-medium"
                        />
                      </div>

                      {/* Color Picker */}
                      <input
                        type="color"
                        value={env.color}
                        onChange={(e) => updateEnvironment(env.id, { color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-gray-500"
                        title="Change color"
                      />

                      {/* Production Badge */}
                      <button
                        onClick={() => updateEnvironment(env.id, { isProduction: !env.isProduction })}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                          env.isProduction
                            ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                        }`}
                        title={env.isProduction ? 'Production environment' : 'Click to mark as production'}
                      >
                        <Star size={12} className={env.isProduction ? 'fill-current' : ''} />
                        {env.isProduction ? 'Prod' : 'Non-Prod'}
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => updateEnvironment(env.id, { enabled: !env.enabled })}
                        className={env.enabled ? 'text-green-600' : 'text-gray-400'}
                        title={env.enabled ? 'Enabled - Click to disable' : 'Disabled - Click to enable'}
                      >
                        {env.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeEnvironment(env.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded transition-colors"
                        title="Remove environment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Help Text */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Tips:</h5>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use arrows to reorder environments</li>
                    <li>Click environment name to edit inline</li>
                    <li>Mark production environments with the star icon</li>
                    <li>Disabled environments won't appear in the dashboard filter</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Azure DevOps Tab */}
            {activeTab === 'azure' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Azure DevOps Connection</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Connect your Azure DevOps organization to fetch test results, pipelines, and work items.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="your-organization"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Found in your Azure DevOps URL: https://dev.azure.com/<strong>your-organization</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Personal Access Token (PAT) *
                    </label>
                    <div className="relative">
                      <input
                        type={showPAT ? 'text' : 'password'}
                        value={pat}
                        onChange={(e) => setPat(e.target.value)}
                        placeholder="Enter your PAT"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPAT(!showPAT)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPAT ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Create a PAT with Read access to Test Management, Work Items, and Build.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Base URL
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://dev.azure.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection || !organization || !pat}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    <Link size={16} />
                    {testingConnection ? 'Testing...' : 'Test Connection'}
                  </button>

                  {connectionStatus === 'success' && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircle size={16} /> Connection successful!
                    </span>
                  )}
                  {connectionStatus === 'error' && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={16} /> Connection failed
                    </span>
                  )}
                </div>

                {/* Data Source Selection */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Test Results Data Source</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose where to read test results from. This determines how the dashboard fetches and categorizes data.
                  </p>

                  <div className="space-y-3">
                    {/* Demo Data */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.dashboard.dataSource === 'demo'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dataSource"
                        value="demo"
                        checked={settings.dashboard.dataSource === 'demo'}
                        onChange={() => updateDashboardSettings({ dataSource: 'demo' })}
                        className="mt-1 accent-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">Demo / Mock Data</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Use built-in sample data. No Azure DevOps connection needed.
                        </div>
                      </div>
                    </label>

                    {/* Pipelines */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.dashboard.dataSource === 'pipelines'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dataSource"
                        value="pipelines"
                        checked={settings.dashboard.dataSource === 'pipelines'}
                        onChange={() => updateDashboardSettings({ dataSource: 'pipelines' })}
                        className="mt-1 accent-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          Pipelines → Test Runs
                          <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Recommended</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Reads test results from all pipeline runs (the Pipeline "Tests" tab). Results are fetched per build and categorized by date & pipeline. Each pipeline becomes a module in the dashboard.
                        </div>
                      </div>
                    </label>

                    {/* Test Plans */}
                    <label
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        settings.dashboard.dataSource === 'testplans'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dataSource"
                        value="testplans"
                        checked={settings.dashboard.dataSource === 'testplans'}
                        onChange={() => updateDashboardSettings({ dataSource: 'testplans' })}
                        className="mt-1 accent-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">Test Plans → Test Runs</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Reads test results from Test Plans / Test Runs API by date. Modules are derived from area paths. Use this if your automated tests update Test Case execution status.
                        </div>
                      </div>
                    </label>
                  </div>

                  {settings.dashboard.dataSource !== 'demo' && !isConfigured && (
                    <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        Fill in the connection fields above and save to use this data source.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAzureConfig}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    Save Configuration
                  </button>
                </div>
              </div>
            )}

            {/* Projects & Pipelines Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select which projects and pipelines to include in the dashboard.
                  </p>
                  <button
                    onClick={() => setShowAddProject(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add Project
                  </button>
                </div>

                {/* Add Project Form */}
                {showAddProject && (
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Add New Project</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddProject}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setShowAddProject(false); setNewProjectName(''); }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Projects List */}
                <div className="space-y-3">
                  {settings.projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FolderKanban size={48} className="mx-auto mb-3 opacity-50" />
                      <p>No projects configured yet.</p>
                      <p className="text-sm">Add projects to start tracking test results.</p>
                    </div>
                  ) : (
                    settings.projects.map(project => (
                      <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleProjectExpanded(project.id)}>
                              {expandedProjects.has(project.id) ? (
                                <ChevronDown size={18} className="text-gray-500" />
                              ) : (
                                <ChevronRight size={18} className="text-gray-500" />
                              )}
                            </button>
                            <FolderKanban size={18} className="text-blue-500" />
                            <span className="font-medium text-gray-900 dark:text-white">{project.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({project.pipelines.length} pipelines)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleProjectEnabled(project.id)}
                              className={`p-1 rounded ${project.enabled ? 'text-green-600' : 'text-gray-400'}`}
                              title={project.enabled ? 'Disable project' : 'Enable project'}
                            >
                              {project.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>
                            <button
                              onClick={() => removeProject(project.id)}
                              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded transition-colors"
                              title="Remove project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {expandedProjects.has(project.id) && (
                          <div className="p-3 space-y-2">
                            {project.pipelines.map(pipeline => (
                              <div key={pipeline.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex items-center gap-2">
                                  <TestTube size={14} className="text-purple-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{pipeline.name}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    pipeline.type === 'build' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                    pipeline.type === 'test' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                    'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                                  }`}>
                                    {pipeline.type}
                                  </span>
                                </div>
                                <button
                                  onClick={() => togglePipelineEnabled(project.id, pipeline.id)}
                                  className={`p-1 rounded ${pipeline.enabled ? 'text-green-600' : 'text-gray-400'}`}
                                >
                                  {pipeline.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Clock size={14} className="inline mr-1" />
                      Auto-Refresh Interval
                    </label>
                    <select
                      value={settings.dashboard.refreshInterval}
                      onChange={(e) => updateDashboardSettings({ refreshInterval: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={0}>Manual only</option>
                      <option value={60}>Every 1 minute</option>
                      <option value={300}>Every 5 minutes</option>
                      <option value={600}>Every 10 minutes</option>
                      <option value={1800}>Every 30 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Environment
                    </label>
                    <select
                      value={settings.dashboard.defaultEnvironment}
                      onChange={(e) => updateDashboardSettings({ defaultEnvironment: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="QA">QA</option>
                      <option value="Stage">Stage</option>
                      <option value="UAT">UAT</option>
                      <option value="Prod">Prod</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <Calendar size={14} className="inline mr-1" />
                      Date Format
                    </label>
                    <select
                      value={settings.dashboard.dateFormat}
                      onChange={(e) => updateDashboardSettings({ dateFormat: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Display Options</h4>

                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer"
                    onClick={() => updateDashboardSettings({ autoExpandProjects: !settings.dashboard.autoExpandProjects })}
                  >
                    <div>
                      <span className="text-gray-900 dark:text-white">Auto-expand projects</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically expand all projects on load</p>
                    </div>
                    <div className={settings.dashboard.autoExpandProjects ? 'text-green-600' : 'text-gray-400'}>
                      {settings.dashboard.autoExpandProjects ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer"
                    onClick={() => updateDashboardSettings({ compactView: !settings.dashboard.compactView })}
                  >
                    <div>
                      <span className="text-gray-900 dark:text-white">Compact view</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show more data with less spacing</p>
                    </div>
                    <div className={settings.dashboard.compactView ? 'text-green-600' : 'text-gray-400'}>
                      {settings.dashboard.compactView ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer"
                    onClick={() => updateDashboardSettings({ showNotifications: !settings.dashboard.showNotifications })}
                  >
                    <div>
                      <span className="text-gray-900 dark:text-white">Show notifications</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Display critical alerts and notifications</p>
                    </div>
                    <div className={settings.dashboard.showNotifications ? 'text-green-600' : 'text-gray-400'}>
                      {settings.dashboard.showNotifications ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Alert Settings</h4>

                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer"
                    onClick={() => updateNotificationSettings({ enableCriticalAlerts: !settings.notifications.enableCriticalAlerts })}
                  >
                    <div>
                      <span className="text-gray-900 dark:text-white">Critical failure alerts</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show popup for critical test failures</p>
                    </div>
                    <div className={settings.notifications.enableCriticalAlerts ? 'text-green-600' : 'text-gray-400'}>
                      {settings.notifications.enableCriticalAlerts ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer"
                    onClick={() => updateNotificationSettings({ enableFailureNotifications: !settings.notifications.enableFailureNotifications })}
                  >
                    <div>
                      <span className="text-gray-900 dark:text-white">Failure notifications</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Notify when tests fail</p>
                    </div>
                    <div className={settings.notifications.enableFailureNotifications ? 'text-green-600' : 'text-gray-400'}>
                      {settings.notifications.enableFailureNotifications ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Integration Webhooks</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Slack Webhook URL
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.slackWebhook}
                      onChange={(e) => updateNotificationSettings({ slackWebhook: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Microsoft Teams Webhook URL
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.teamsWebhook}
                      onChange={(e) => updateNotificationSettings({ teamsWebhook: e.target.value })}
                      placeholder="https://outlook.office.com/webhook/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Access Control Tab - Admin Only */}
            {activeTab === 'access' && userRole === 'admin' && (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                    <Shield size={18} />
                    Access Control Settings
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Manage who can view and edit dashboard settings. Only admins can access this section.
                  </p>
                </div>

                {/* Enable RBAC Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">Enable Access Control</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      When enabled, only admins and leads can modify settings. Others have read-only access.
                    </p>
                  </div>
                  <button
                    onClick={() => updateRBACConfig({ enabled: !settings.rbac?.enabled })}
                    className={settings.rbac?.enabled ? 'text-green-600' : 'text-gray-400'}
                  >
                    {settings.rbac?.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                {settings.rbac?.enabled && (
                  <>
                    {/* Admins List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Shield size={16} className="text-red-500" />
                          Administrators
                        </h5>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Full access to all settings</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="admin@company.com"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
                        />
                        <button
                          onClick={handleAddAdmin}
                          disabled={!newAdminEmail.trim()}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {(settings.rbac?.adminEmails || []).map((email) => (
                          <div key={email} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
                            <span className="text-sm text-gray-900 dark:text-white">{email}</span>
                            <button
                              onClick={() => handleRemoveAdmin(email)}
                              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(settings.rbac?.adminEmails || []).length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No administrators configured</p>
                        )}
                      </div>
                    </div>

                    {/* Leads List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Users size={16} className="text-blue-500" />
                          Project Leads
                        </h5>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Can edit settings, cannot manage access</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newLeadEmail}
                          onChange={(e) => setNewLeadEmail(e.target.value)}
                          placeholder="lead@company.com"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddLead()}
                        />
                        <button
                          onClick={handleAddLead}
                          disabled={!newLeadEmail.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        {(settings.rbac?.leadEmails || []).map((email) => (
                          <div key={email} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <span className="text-sm text-gray-900 dark:text-white">{email}</span>
                            <button
                              onClick={() => handleRemoveLead(email)}
                              className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {(settings.rbac?.leadEmails || []).length === 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No project leads configured</p>
                        )}
                      </div>
                    </div>

                    {/* Role Permissions Summary */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3">Role Permissions</h5>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 text-gray-600 dark:text-gray-400">Permission</th>
                            <th className="text-center py-2 text-red-600 dark:text-red-400">Admin</th>
                            <th className="text-center py-2 text-blue-600 dark:text-blue-400">Lead</th>
                            <th className="text-center py-2 text-gray-600 dark:text-gray-400">Viewer</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-300">
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2">View Dashboard</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✓</td>
                          </tr>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2">Export Reports</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✓</td>
                          </tr>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2">Create Defects</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✗</td>
                          </tr>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2">Edit Settings</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✗</td>
                          </tr>
                          <tr>
                            <td className="py-2">Manage Access Control</td>
                            <td className="text-center">✓</td>
                            <td className="text-center">✗</td>
                            <td className="text-center">✗</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {!settings.rbac?.enabled && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>Note:</strong> Access control is currently disabled. All users have full admin access to settings.
                      Enable access control above to restrict settings to authorized users only.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {canEditSettings ? (
              <button
                onClick={resetSettings}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                Reset All Settings
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Lock size={14} />
                Read-only mode - Contact an admin to make changes
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

