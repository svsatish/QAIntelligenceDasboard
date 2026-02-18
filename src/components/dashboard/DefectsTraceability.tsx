import React, { useState } from 'react';
import { Bug, ExternalLink, AlertCircle, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react';
import { Defect, TestFailureDefect, Environment } from '../../services/mockData';
import CreateDefectModal from './CreateDefectModal';
import { format } from 'date-fns';
import { useSettings } from '../../context/SettingsContext';

interface DefectsTraceabilityProps {
  defects: Defect[];
  testFailures: TestFailureDefect[];
  selectedEnvironment: Environment;
}

interface PrefilledDefectData {
  testId?: string;
  testName?: string;
  suiteName?: string;
  failureReason?: string;
  environment?: Environment;
}

const DefectsTraceability: React.FC<DefectsTraceabilityProps> = ({ defects, testFailures, selectedEnvironment }) => {
  const { settings } = useSettings();
  const compactView = settings?.dashboard?.compactView ?? false;

  const [activeTab, setActiveTab] = useState<'defects' | 'traceability'>('defects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<PrefilledDefectData | undefined>();

  const openCreateDefectModal = (data?: PrefilledDefectData) => {
    setPrefilledData(data ? { ...data, environment: selectedEnvironment } : { environment: selectedEnvironment });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPrefilledData(undefined);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
      case 'major': return 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300';
      case 'minor': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300';
      case 'trivial': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
      case 'in-progress': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300';
      case 'resolved': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300';
      case 'closed': return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="text-red-500" size={14} />;
      case 'in-progress': return <Clock className="text-yellow-500" size={14} />;
      case 'resolved': return <CheckCircle2 className="text-blue-500" size={14} />;
      case 'closed': return <CheckCircle2 className="text-green-500" size={14} />;
      default: return <XCircle className="text-gray-500" size={14} />;
    }
  };

  // Summary stats
  const openDefects = defects.filter(d => d.status === 'open').length;
  const criticalDefects = defects.filter(d => d.severity === 'critical' && d.status !== 'closed').length;
  const inProgressDefects = defects.filter(d => d.status === 'in-progress').length;
  const resolvedDefects = defects.filter(d => d.status === 'resolved').length;

  return (
    <div className={`bg-white dark:bg-gray-800 ${compactView ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${compactView ? 'mb-3' : 'mb-4'}`}>
        <div className="flex items-center gap-2">
          <Bug className="text-red-500" size={20} />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Defects & Traceability</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openCreateDefectModal()}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Create </span>Defect
          </button>
          <button
            onClick={() => setActiveTab('defects')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'defects'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Defects ({defects.length})
          </button>
          <button
            onClick={() => setActiveTab('traceability')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'traceability'
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Test Failures ({testFailures.length})
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{openDefects}</div>
          <div className="text-xs text-red-600 dark:text-red-300">Open</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{criticalDefects}</div>
          <div className="text-xs text-orange-600 dark:text-orange-300">Critical</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{inProgressDefects}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-300">In Progress</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{resolvedDefects}</div>
          <div className="text-xs text-blue-600 dark:text-blue-300">Resolved</div>
        </div>
      </div>

      {/* Tabular Content */}
      <div className="overflow-x-auto">
        {activeTab === 'defects' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Severity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Assignee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Created</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Linked Tests</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {defects.map((defect) => (
                <tr
                  key={defect.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-3 px-4">
                    <a
                      href={defect.jiraLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      {defect.id}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white max-w-xs truncate" title={defect.title}>
                    {defect.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(defect.severity)}`}>
                      {defect.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 w-fit ${getStatusColor(defect.status)}`}>
                      {getStatusIcon(defect.status)}
                      {defect.status.charAt(0).toUpperCase() + defect.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{defect.assignee}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {format(new Date(defect.createdDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-600 dark:text-gray-400">{defect.linkedTestIds.length} tests</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <a
                      href={defect.jiraLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded transition-colors"
                      title="Open in Azure DevOps"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Test ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Test Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Suite</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Failure Reason</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Linked Defects</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testFailures.map((failure) => (
                <tr
                  key={failure.testId}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{failure.testId}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white max-w-xs truncate" title={failure.testName}>
                    {failure.testName}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{failure.suiteName}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded block truncate max-w-xs" title={failure.failureReason}>
                      {failure.failureReason}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {failure.defects.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {failure.defects.map((defect) => (
                          <a
                            key={defect.id}
                            href={defect.jiraLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs px-2 py-0.5 rounded font-medium hover:underline ${getSeverityColor(defect.severity)}`}
                          >
                            {defect.id}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <AlertCircle size={12} />
                        Not linked
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {failure.defects.length === 0 && (
                      <button
                        onClick={() => openCreateDefectModal({
                          testId: failure.testId,
                          testName: failure.testName,
                          suiteName: failure.suiteName,
                          failureReason: failure.failureReason,
                        })}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        <Plus size={12} />
                        Create Defect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Defect Modal */}
      <CreateDefectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        prefilledData={prefilledData}
      />
    </div>
  );
};

export default DefectsTraceability;

