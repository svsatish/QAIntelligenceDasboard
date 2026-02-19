import React, { useState } from 'react';
import { X, Copy, ExternalLink, Check, Bug, AlertCircle, Lock } from 'lucide-react';
import { Environment } from '../../services/mockData';
import { useSettings } from '../../context/SettingsContext';

interface CreateDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledData?: {
    testId?: string;
    testName?: string;
    suiteName?: string;
    failureReason?: string;
    environment?: Environment;
  };
}

interface DefectFormData {
  title: string;
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  priority: '1' | '2' | '3' | '4';
  environment: Environment;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  buildVersion: string;
  browser: string;
  assignedTo: string;
  linkedTestCase: string;
  attachments: string;
  additionalNotes: string;
}

const CreateDefectModal: React.FC<CreateDefectModalProps> = ({ isOpen, onClose, prefilledData }) => {
  const { canCreateDefects } = useSettings();
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<DefectFormData>({
    title: prefilledData?.testName ? `[${prefilledData.suiteName}] ${prefilledData.testName} - Test Failure` : '',
    severity: 'major',
    priority: '2',
    environment: prefilledData?.environment || 'Stage',
    stepsToReproduce: prefilledData?.testId ? `1. Execute test case: ${prefilledData.testId}\n2. Observe the failure in ${prefilledData.suiteName} suite\n3. ` : '1. \n2. \n3. ',
    expectedResult: '',
    actualResult: prefilledData?.failureReason || '',
    buildVersion: '2024.02.16.001',
    browser: 'Chrome 121.0',
    assignedTo: '',
    linkedTestCase: prefilledData?.testId || '',
    attachments: '',
    additionalNotes: '',
  });

  // Check permission
  if (!canCreateDefects && isOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md m-4">
          <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400 mb-4">
            <Lock size={24} />
            <h3 className="text-lg font-semibold">Permission Denied</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to create defects. Contact an administrator or project lead for access.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  const generateAzureDevOpsTemplate = () => {
    return `## Defect Report

### Summary
**Title:** ${formData.title}
**Severity:** ${formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)}
**Priority:** P${formData.priority}
**Environment:** ${formData.environment}

---

### Environment Details
- **Build Version:** ${formData.buildVersion}
- **Browser/Platform:** ${formData.browser}
- **Test Environment:** ${formData.environment}

---

### Description

#### Steps to Reproduce
${formData.stepsToReproduce}

#### Expected Result
${formData.expectedResult}

#### Actual Result
${formData.actualResult}

---

### Additional Information
- **Linked Test Case:** ${formData.linkedTestCase}
- **Assigned To:** ${formData.assignedTo || 'Unassigned'}
- **Attachments:** ${formData.attachments || 'None'}

### Notes
${formData.additionalNotes || 'N/A'}

---
*Generated from QA Intelligence Dashboard on ${new Date().toLocaleString()}*`;
  };

  const handleCopyToClipboard = async () => {
    const template = generateAzureDevOpsTemplate();
    await navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateInAzureDevOps = () => {
    // Azure DevOps work item creation URL
    // Format: https://{organization}/{project}/_workitems/create/Bug
    const azureDevOpsOrg = 'your-organization'; // This would be configurable
    const project = 'your-project'; // This would be configurable

    // Encode the title and description for URL
    const title = encodeURIComponent(formData.title);
    const description = encodeURIComponent(generateAzureDevOpsTemplate());

    // Azure DevOps URL with pre-filled fields
    const url = `https://dev.azure.com/${azureDevOpsOrg}/${project}/_workitems/create/Bug?[System.Title]=${title}&[System.Description]=${description}&[Microsoft.VSTS.Common.Severity]=${formData.severity}&[Microsoft.VSTS.Common.Priority]=${formData.priority}`;

    window.open(url, '_blank');
  };

  const handleInputChange = (field: keyof DefectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bug className="text-red-500" size={24} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Defect in Azure DevOps</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the defect"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity *
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="trivial">Trivial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">P1 - Critical</option>
                    <option value="2">P2 - High</option>
                    <option value="3">P3 - Medium</option>
                    <option value="4">P4 - Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={(e) => handleInputChange('environment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="QA">QA</option>
                    <option value="Stage">Stage</option>
                    <option value="UAT">UAT</option>
                    <option value="Prod">Prod</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Build Version
                  </label>
                  <input
                    type="text"
                    value={formData.buildVersion}
                    onChange={(e) => handleInputChange('buildVersion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Browser/Platform
                </label>
                <input
                  type="text"
                  value={formData.browser}
                  onChange={(e) => handleInputChange('browser', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Chrome 121.0, Windows 11"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Linked Test Case
                </label>
                <input
                  type="text"
                  value={formData.linkedTestCase}
                  onChange={(e) => handleInputChange('linkedTestCase', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="TC-XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="team@company.com"
                />
              </div>
            </div>

            {/* Right Column - Description Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Steps to Reproduce *
                </label>
                <textarea
                  value={formData.stepsToReproduce}
                  onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observe that..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Result *
                </label>
                <textarea
                  value={formData.expectedResult}
                  onChange={(e) => handleInputChange('expectedResult', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="The expected behavior..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Actual Result *
                </label>
                <textarea
                  value={formData.actualResult}
                  onChange={(e) => handleInputChange('actualResult', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="The actual behavior or error message..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional context, workarounds, or related information..."
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview (Azure DevOps Template)</h3>
              <button
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
            </div>
            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
              {generateAzureDevOpsTemplate()}
            </pre>
          </div>

          {/* Info Banner */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-2">
            <AlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> You can either copy the template to your clipboard and paste it into Azure DevOps,
              or click "Create in Azure DevOps" to open a new bug work item with pre-filled details.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Copy size={16} />
            Copy to Clipboard
          </button>
          <button
            onClick={handleCreateInAzureDevOps}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <ExternalLink size={16} />
            Create in Azure DevOps
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDefectModal;

