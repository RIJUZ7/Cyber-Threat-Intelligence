import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { CommandCenter } from './components/CommandCenter';
import { MessageScanner } from './components/MessageScanner';
import { ForensicsLab } from './components/ForensicsLab';
import { ThreatArchive } from './components/ThreatArchive';
import { ModelObservatory } from './components/ModelObservatory';
import { SystemAbout } from './components/SystemAbout';
import { api } from './services/api';
import {
  AnalyzeResponse,
  ArchiveRecord,
  ModelMetrics,
  ModelInfo,
  SampleMessage
} from './types/forensics';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('command-center');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [modelVersion, setModelVersion] = useState<string>('v1.0.0-LR');
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [samples, setSamples] = useState<SampleMessage[]>([]);
  const [archiveRecords, setArchiveRecords] = useState<ArchiveRecord[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Scanner initial parameters for quick sample dispatch
  const [scannerInit, setScannerInit] = useState<{
    message: string;
    sender: string;
    source: string;
  }>({ message: '', sender: '', source: 'email' });

  // Session Statistics
  const [sessionStats, setSessionStats] = useState({
    totalScanned: 0,
    spamCount: 0,
    highRiskCount: 0,
  });

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      const health = await api.getHealth();
      setIsBackendHealthy(health.status === 'healthy');
      setModelVersion(`v${health.version}-LR`);
    } catch {
      setIsBackendHealthy(false);
    }

    try {
      const m = await api.getModelMetrics();
      setMetrics(m);
    } catch (e) {
      console.warn('Could not load model metrics:', e);
    }

    try {
      const info = await api.getModelInfo();
      setModelInfo(info);
    } catch (e) {
      console.warn('Could not load model info:', e);
    }

    try {
      const smpls = await api.getSamples();
      setSamples(smpls);
    } catch (e) {
      console.warn('Could not load samples:', e);
    }

    try {
      const arch = await api.getArchive();
      setArchiveRecords(arch.records || []);
    } catch (e) {
      console.warn('Could not load archive:', e);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Global Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('scanner');
        return;
      }

      switch (e.key) {
        case '1':
          setActiveTab('command-center');
          break;
        case '2':
          setActiveTab('scanner');
          break;
        case '3':
          setActiveTab('forensics-lab');
          break;
        case '4':
          setActiveTab('archive');
          break;
        case '5':
          setActiveTab('observatory');
          break;
        case '6':
          setActiveTab('system-about');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Analysis Dispatcher
  const handleAnalyze = async (message: string, sender: string, sourceType: string): Promise<AnalyzeResponse> => {
    setIsAnalyzing(true);
    try {
      const response = await api.analyzeMessage({
        message,
        sender: sender || undefined,
        source_type: sourceType,
      });

      setLastAnalysis(response);

      // Update session statistics
      setSessionStats((prev) => ({
        totalScanned: prev.totalScanned + 1,
        spamCount: prev.spamCount + (response.verdict !== 'NOT FLAGGED AS SPAM' ? 1 : 0),
        highRiskCount: prev.highRiskCount + (response.heuristic_risk_score >= 65 ? 1 : 0),
      }));

      // Reload archive records to include the new investigation
      const updatedArchive = await api.getArchive();
      setArchiveRecords(updatedArchive.records || []);

      return response;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Inspect Record in Forensics Lab
  const handleInspectRecord = (record: ArchiveRecord) => {
    setLastAnalysis(record.analysis_data);
    setActiveTab('forensics-lab');
  };

  // Load Sample Message into Scanner
  const handleLoadSample = (sampleId: string) => {
    const found = samples.find((s) => s.id === sampleId);
    if (found) {
      setScannerInit({
        message: found.full_text,
        sender: found.sender,
        source: found.source_type,
      });
      setActiveTab('scanner');
    }
  };

  // Delete Record from Archive
  const handleDeleteRecord = async (id: string) => {
    await api.deleteArchiveRecord(id);
    setArchiveRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Clear All Records from Archive
  const handleClearArchive = async () => {
    await api.clearArchive();
    setArchiveRecords([]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-forensic-text scanline-effect selection:bg-accent-lime selection:text-background">
      {/* Top Status & Brand Header */}
      <Header
        isBackendHealthy={isBackendHealthy}
        modelVersion={modelVersion}
        onOpenScannerShortcut={() => setActiveTab('scanner')}
      />

      {/* Main Body Workspace with Left Navigation Rail */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent Left Rail */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          sessionStats={{
            totalScanned: sessionStats.totalScanned,
            highRiskCount: sessionStats.highRiskCount,
          }}
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-[#0B0D10] bg-forensic-grid">
          {activeTab === 'command-center' && (
            <CommandCenter
              onNavigate={setActiveTab}
              recentRecords={archiveRecords}
              sessionStats={sessionStats}
              metrics={metrics}
              onInspectRecord={handleInspectRecord}
              onLoadSample={handleLoadSample}
            />
          )}

          {activeTab === 'scanner' && (
            <MessageScanner
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              lastAnalysis={lastAnalysis}
              samples={samples}
              onInspectInLab={(analysis) => {
                setLastAnalysis(analysis);
                setActiveTab('forensics-lab');
              }}
              initialMessage={scannerInit.message}
              initialSender={scannerInit.sender}
              initialSource={scannerInit.source}
            />
          )}

          {activeTab === 'forensics-lab' && (
            <ForensicsLab
              currentAnalysis={lastAnalysis}
              onReset={() => setLastAnalysis(null)}
              onNavigateToScanner={() => setActiveTab('scanner')}
            />
          )}

          {activeTab === 'archive' && (
            <ThreatArchive
              records={archiveRecords}
              onInspectRecord={handleInspectRecord}
              onDeleteRecord={handleDeleteRecord}
              onClearArchive={handleClearArchive}
            />
          )}

          {activeTab === 'observatory' && (
            <ModelObservatory metrics={metrics} modelInfo={modelInfo} />
          )}

          {activeTab === 'system-about' && <SystemAbout />}
        </main>
      </div>
    </div>
  );
};

export default App;
