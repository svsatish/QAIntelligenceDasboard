import React, { useState } from 'react';
import { Download, Settings, RefreshCw, Calendar, Server, Moon, Sun, Database, Cloud } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { Environment } from '../../services/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import SettingsModal from './SettingsModal';

interface DashboardHeaderProps {
  onRefresh: () => void;
  selectedEnvironment: Environment;
  onEnvironmentChange: (env: Environment) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  selectedEnvironment,
  onEnvironmentChange,
  selectedDate,
  onDateChange
}) => {
  const { toggleTheme, isDark } = useTheme();
  const { isConfigured, settings, getEnabledEnvironments } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dashboardName = settings.branding?.dashboardName || 'Test Automation Dashboard';
  const companyLogo = settings.branding?.companyLogo;
  const compactView = settings?.dashboard?.compactView ?? false;

  // Get enabled environments from settings
  const enabledEnvironments = getEnabledEnvironments();

  const handleDownloadPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    // Capture the dashboard content with better quality settings
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    // Header section height
    const headerHeight = 25;
    const margin = 10;

    // Add header background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pdfWidth, headerHeight, 'F');

    // Add company logo if exists
    let logoEndX = margin;
    if (companyLogo) {
      try {
        pdf.addImage(companyLogo, 'PNG', margin, 5, 15, 15);
        logoEndX = margin + 18;
      } catch (e) {
        console.warn('Failed to add logo to PDF');
      }
    }

    // Add dashboard name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(31, 41, 55);
    pdf.text(dashboardName, logoEndX, 12);

    // Add environment badge
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Environment: ${selectedEnvironment}`, logoEndX, 18);

    // Add generation date/time on the right
    const generatedAt = format(new Date(), 'MMM dd, yyyy \'at\' hh:mm a');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Generated: ${generatedAt}`, pdfWidth - margin, 10, { align: 'right' });
    pdf.text(`Report Date: ${format(selectedDate, 'MMM dd, yyyy')}`, pdfWidth - margin, 16, { align: 'right' });

    // Add separator line
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, headerHeight - 2, pdfWidth - margin, headerHeight - 2);

    // Calculate content dimensions
    const contentStartY = headerHeight + 2;
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add dashboard content
    pdf.addImage(imgData, 'PNG', margin, contentStartY, imgWidth, imgHeight);

    // Save the PDF
    const fileName = `${dashboardName.replace(/\s+/g, '-').toLowerCase()}-${selectedEnvironment}-${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className={`flex flex-col ${compactView ? 'gap-3 mb-4 p-4' : 'gap-4 mb-8 p-6'} bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200`}>
      {/* Top Row - Title and Actions */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center ${compactView ? 'gap-3' : 'gap-4'}`}>
        <div className="flex items-center gap-3">
          {/* Company Logo */}
          {companyLogo && (
            <img
              src={companyLogo}
              alt="Company Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardName}</h1>
          {/* Data Source Indicator */}
          {isConfigured ? (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
              <Cloud size={12} />
              Azure DevOps
            </span>
          ) : (
            <span
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              onClick={() => setIsSettingsOpen(true)}
              title="Click to configure Azure DevOps"
            >
              <Database size={12} />
              Demo Data
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
          >
            <RefreshCw size={18} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        {/* Environment Selector */}
        <div className="flex items-center gap-2">
          <Server size={18} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Environment:</span>
          <div className="flex gap-2">
            {enabledEnvironments.map((env) => {
              const isSelected = selectedEnvironment === env.name;
              return (
                <button
                  key={env.id}
                  onClick={() => onEnvironmentChange(env.name as Environment)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    isSelected ? '' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                  style={isSelected ? {
                    backgroundColor: `${env.color}20`,
                    color: env.color,
                    borderColor: `${env.color}60`,
                  } : {}}
                >
                  {env.name}
                  {env.isProduction && <span className="ml-1 text-yellow-500">★</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-2 ml-auto">
          <Calendar size={18} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Run Date:</span>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => onDateChange(new Date(e.target.value))}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(selectedDate, 'MMM dd, yyyy')}
          </span>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default DashboardHeader;
