// ============================================================
// MDS-DL Mock Data — Realistic seed data for the entire system
// ============================================================

export const malwareFamilies = [
  { id: 'emotet', name: 'Emotet', category: 'Trojan/Botnet', severity: 'critical', color: '#ff3b5c', firstSeen: '2014-06-01', lastSeen: '2026-04-09', samples: 248531, description: 'Banking trojan turned modular botnet, primary delivery mechanism for secondary payloads including ransomware.' },
  { id: 'ryuk', name: 'Ryuk', category: 'Ransomware', severity: 'critical', color: '#ff6b35', firstSeen: '2018-08-01', lastSeen: '2026-04-08', samples: 87421, description: 'Targeted ransomware deployed post-compromise via TrickBot/BazarLoader, demands multi-million dollar ransoms.' },
  { id: 'mirai', name: 'Mirai', category: 'IoT Botnet', severity: 'high', color: '#ffc107', firstSeen: '2016-08-01', lastSeen: '2026-04-10', samples: 192847, description: 'IoT botnet exploiting default credentials, used for large-scale DDoS attacks.' },
  { id: 'cobalt_strike', name: 'Cobalt Strike', category: 'C2 Framework', severity: 'critical', color: '#e040fb', firstSeen: '2012-01-01', lastSeen: '2026-04-10', samples: 156203, description: 'Commercial adversary simulation tool frequently abused by threat actors for post-exploitation.' },
  { id: 'qakbot', name: 'QakBot', category: 'Banking Trojan', severity: 'high', color: '#00e5ff', firstSeen: '2007-01-01', lastSeen: '2026-03-28', samples: 134892, description: 'Banking trojan with worm capabilities, spreads via malicious email campaigns.' },
  { id: 'lockbit', name: 'LockBit 3.0', category: 'Ransomware', severity: 'critical', color: '#ff1744', firstSeen: '2019-09-01', lastSeen: '2026-04-10', samples: 67234, description: 'Ransomware-as-a-Service (RaaS) with advanced encryption and double extortion capabilities.' },
  { id: 'agenttesla', name: 'Agent Tesla', category: 'Infostealer', severity: 'high', color: '#69f0ae', firstSeen: '2014-01-01', lastSeen: '2026-04-09', samples: 312745, description: '.NET-based RAT and infostealer with keylogging, clipboard capture, and credential theft.' },
  { id: 'asyncrat', name: 'AsyncRAT', category: 'RAT', severity: 'high', color: '#7c4dff', firstSeen: '2019-01-01', lastSeen: '2026-04-10', samples: 98234, description: 'Open-source remote access trojan with full remote control capabilities.' },
  { id: 'redline', name: 'RedLine Stealer', category: 'Infostealer', severity: 'medium', color: '#ff9100', firstSeen: '2020-03-01', lastSeen: '2026-04-10', samples: 215678, description: 'MaaS infostealer targeting browser credentials, crypto wallets, and system information.' },
  { id: 'formbook', name: 'Formbook/XLoader', category: 'Infostealer', severity: 'high', color: '#76ff03', firstSeen: '2016-01-01', lastSeen: '2026-04-10', samples: 189432, description: 'Form-grabber and keylogger sold on underground forums, evolved into XLoader for macOS.' }
];

export const attackTechniques = [
  { id: 'T1059.001', tactic: 'Execution', name: 'PowerShell', description: 'Abuse of PowerShell for command execution and script-based attacks.' },
  { id: 'T1055.001', tactic: 'Defense Evasion', name: 'DLL Injection', description: 'Inject malicious code into running processes via DLL injection.' },
  { id: 'T1027', tactic: 'Defense Evasion', name: 'Obfuscated Files', description: 'Use of encoding, encryption, or obfuscation to hide malicious content.' },
  { id: 'T1547.001', tactic: 'Persistence', name: 'Registry Run Keys', description: 'Persistence via Windows registry run keys or startup folder.' },
  { id: 'T1071.001', tactic: 'Command and Control', name: 'Web Protocols', description: 'C2 communication over HTTP/HTTPS protocols.' },
  { id: 'T1486', tactic: 'Impact', name: 'Data Encrypted for Impact', description: 'Encrypt files on victim systems to extort payment.' },
  { id: 'T1003.001', tactic: 'Credential Access', name: 'LSASS Memory', description: 'Dump credentials from LSASS process memory.' },
  { id: 'T1566.001', tactic: 'Initial Access', name: 'Spearphishing Attachment', description: 'Send targeted emails with malicious attachments.' },
  { id: 'T1083', tactic: 'Discovery', name: 'File and Directory Discovery', description: 'Enumerate files and directories on compromised systems.' },
  { id: 'T1105', tactic: 'Command and Control', name: 'Ingress Tool Transfer', description: 'Transfer tools or files from external systems into the compromised environment.' },
  { id: 'T1036.005', tactic: 'Defense Evasion', name: 'Match Legitimate Name', description: 'Rename malicious files to match legitimate system files.' },
  { id: 'T1053.005', tactic: 'Execution', name: 'Scheduled Task', description: 'Abuse task scheduler for persistent execution.' },
  { id: 'T1218.011', tactic: 'Defense Evasion', name: 'Rundll32', description: 'Proxy execution of malicious code via rundll32.exe.' },
  { id: 'T1070.004', tactic: 'Defense Evasion', name: 'File Deletion', description: 'Delete files to remove evidence of intrusion.' },
  { id: 'T1497.001', tactic: 'Defense Evasion', name: 'System Checks', description: 'Check for virtualized or sandboxed environments to evade analysis.' }
];

export const recentDetections = [
  { id: 'det-001', filename: 'invoice_march_2026.docm', hash: 'a3f2b8c1d4e5f6789012345678abcdef', verdict: 'malicious', confidence: 0.987, family: 'emotet', severity: 'critical', timestamp: '2026-04-10T11:42:00Z', fileType: 'Office Macro', fileSize: 245760, techniques: ['T1566.001', 'T1059.001', 'T1547.001'], source: 'Email Gateway' },
  { id: 'det-002', filename: 'svchost_update.exe', hash: 'b4c3d2e1f0a9876543210fedcba98765', verdict: 'malicious', confidence: 0.994, family: 'cobalt_strike', severity: 'critical', timestamp: '2026-04-10T11:38:00Z', fileType: 'PE32', fileSize: 1048576, techniques: ['T1055.001', 'T1071.001', 'T1036.005'], source: 'EDR Agent' },
  { id: 'det-003', filename: 'chrome_installer.msi', hash: 'c5d4e3f2a1b0987654321fedcba87654', verdict: 'malicious', confidence: 0.923, family: 'redline', severity: 'high', timestamp: '2026-04-10T11:35:00Z', fileType: 'MSI', fileSize: 3145728, techniques: ['T1027', 'T1083', 'T1003.001'], source: 'Web Proxy' },
  { id: 'det-004', filename: 'quarterly_report.pdf', hash: 'd6e5f4a3b2c10987654321fedcba7654', verdict: 'benign', confidence: 0.012, family: null, severity: 'none', timestamp: '2026-04-10T11:32:00Z', fileType: 'PDF', fileSize: 524288, techniques: [], source: 'API Upload' },
  { id: 'det-005', filename: 'system32_patch.dll', hash: 'e7f6a5b4c3d2109876543fedcba65432', verdict: 'malicious', confidence: 0.978, family: 'qakbot', severity: 'high', timestamp: '2026-04-10T11:28:00Z', fileType: 'DLL', fileSize: 786432, techniques: ['T1218.011', 'T1055.001', 'T1070.004'], source: 'EDR Agent' },
  { id: 'det-006', filename: 'readme.txt', hash: 'f8a7b6c5d4e3210987654fedcba54321', verdict: 'benign', confidence: 0.003, family: null, severity: 'none', timestamp: '2026-04-10T11:25:00Z', fileType: 'Text', fileSize: 2048, techniques: [], source: 'API Upload' },
  { id: 'det-007', filename: 'winupdate64.exe', hash: '1a2b3c4d5e6f7890abcdef1234567890', verdict: 'malicious', confidence: 0.961, family: 'lockbit', severity: 'critical', timestamp: '2026-04-10T11:20:00Z', fileType: 'PE64', fileSize: 2097152, techniques: ['T1486', 'T1083', 'T1497.001'], source: 'Sandbox' },
  { id: 'det-008', filename: 'node_modules.zip', hash: '2b3c4d5e6f7890ab1cdef2345678901a', verdict: 'benign', confidence: 0.045, family: null, severity: 'none', timestamp: '2026-04-10T11:15:00Z', fileType: 'Archive', fileSize: 10485760, techniques: [], source: 'API Upload' },
  { id: 'det-009', filename: 'payload_dropper.ps1', hash: '3c4d5e6f7890ab12cdef34567890ab1c', verdict: 'malicious', confidence: 0.998, family: 'asyncrat', severity: 'high', timestamp: '2026-04-10T11:10:00Z', fileType: 'PowerShell', fileSize: 8192, techniques: ['T1059.001', 'T1105', 'T1053.005'], source: 'Email Gateway' },
  { id: 'det-010', filename: 'photo_vacation.jpg.exe', hash: '4d5e6f7890ab123cdef45678901ab2cd', verdict: 'malicious', confidence: 0.945, family: 'agenttesla', severity: 'high', timestamp: '2026-04-10T11:05:00Z', fileType: 'PE32', fileSize: 1572864, techniques: ['T1036.005', 'T1027', 'T1547.001'], source: 'Email Gateway' }
];

export const modelRegistry = [
  { id: 'malconv-v3', name: 'MalConv Static Analyzer', version: '3.2.1', architecture: '1D CNN', inputType: 'Raw binary bytes', status: 'production', accuracy: 0.971, precision: 0.968, recall: 0.975, f1: 0.971, auc: 0.993, latencyP50: 45, latencyP95: 120, latencyP99: 280, lastTrained: '2026-04-03T08:00:00Z', trainingSamples: 2400000, framework: 'PyTorch', servedBy: 'Triton', format: 'ONNX' },
  { id: 'behavior-bert-v2', name: 'Behavioral Sequence Model', version: '2.1.0', architecture: 'Transformer (BERT-style)', inputType: 'API call traces', status: 'production', accuracy: 0.965, precision: 0.958, recall: 0.982, f1: 0.970, auc: 0.991, latencyP50: 85, latencyP95: 210, latencyP99: 450, lastTrained: '2026-04-01T12:00:00Z', trainingSamples: 1800000, framework: 'PyTorch', servedBy: 'Triton', format: 'ONNX' },
  { id: 'gnn-sage-v1', name: 'Graph Neural Network', version: '1.4.2', architecture: 'GraphSAGE', inputType: 'CFG / import graphs', status: 'production', accuracy: 0.948, precision: 0.941, recall: 0.956, f1: 0.948, auc: 0.984, latencyP50: 120, latencyP95: 350, latencyP99: 680, lastTrained: '2026-03-28T16:00:00Z', trainingSamples: 950000, framework: 'PyTorch Geometric', servedBy: 'Triton', format: 'ONNX' },
  { id: 'vision-resnet-v2', name: 'Binary Visualization Classifier', version: '2.0.3', architecture: 'EfficientNet-B3', inputType: 'Binary visualization', status: 'production', accuracy: 0.938, precision: 0.932, recall: 0.944, f1: 0.938, auc: 0.979, latencyP50: 35, latencyP95: 95, latencyP99: 180, lastTrained: '2026-03-25T10:00:00Z', trainingSamples: 3200000, framework: 'PyTorch', servedBy: 'Triton', format: 'TensorRT' },
  { id: 'ensemble-meta-v3', name: 'Ensemble Meta-Learner', version: '3.0.0', architecture: 'LightGBM + MLP', inputType: 'Model outputs', status: 'production', accuracy: 0.983, precision: 0.981, recall: 0.986, f1: 0.983, auc: 0.997, latencyP50: 8, latencyP95: 22, latencyP99: 45, lastTrained: '2026-04-05T14:00:00Z', trainingSamples: 5000000, framework: 'LightGBM + PyTorch', servedBy: 'Triton', format: 'ONNX' }
];

export const dashboardStats = {
  totalScanned: 1847293,
  malwareDetected: 284621,
  detectionRate: 0.978,
  falsePositiveRate: 0.018,
  avgLatency: 287,
  activeThreats: 47,
  samplesLast24h: 12847,
  malwareLast24h: 1923,
  zeroDay: 34,
  criticalAlerts: 12,
  highAlerts: 28,
  mediumAlerts: 47,
  lowAlerts: 156
};

export const timeSeriesData = (() => {
  const data = [];
  const now = new Date('2026-04-10T12:00:00Z');
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    data.push({
      time: t.toISOString(),
      label: t.getUTCHours().toString().padStart(2, '0') + ':00',
      scanned: Math.floor(400 + Math.random() * 200),
      malicious: Math.floor(40 + Math.random() * 60),
      benign: Math.floor(340 + Math.random() * 180)
    });
  }
  return data;
})();

export const severityDistribution = [
  { label: 'Critical', value: 12, color: '#ff3b5c' },
  { label: 'High', value: 28, color: '#ff6b35' },
  { label: 'Medium', value: 47, color: '#ffc107' },
  { label: 'Low', value: 156, color: '#00e5ff' },
  { label: 'Info', value: 89, color: '#69f0ae' }
];

export const familyDistribution = [
  { family: 'Emotet', count: 342 },
  { family: 'Agent Tesla', count: 287 },
  { family: 'RedLine', count: 234 },
  { family: 'QakBot', count: 198 },
  { family: 'Cobalt Strike', count: 176 },
  { family: 'LockBit', count: 145 },
  { family: 'Mirai', count: 134 },
  { family: 'AsyncRAT', count: 112 },
  { family: 'Formbook', count: 98 },
  { family: 'Other', count: 197 }
];

export const weeklyTrend = (() => {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let w = 3; w >= 0; w--) {
    days.forEach((d, i) => {
      data.push({
        label: w === 0 ? d : `W-${w} ${d}`,
        detections: Math.floor(150 + Math.random() * 100),
        falsePositives: Math.floor(2 + Math.random() * 5)
      });
    });
  }
  return data;
})();

export const geoDistribution = [
  { country: 'United States', code: 'US', attacks: 4521 },
  { country: 'Russia', code: 'RU', attacks: 3892 },
  { country: 'China', code: 'CN', attacks: 3245 },
  { country: 'Brazil', code: 'BR', attacks: 1876 },
  { country: 'India', code: 'IN', attacks: 1654 },
  { country: 'Germany', code: 'DE', attacks: 1243 },
  { country: 'United Kingdom', code: 'GB', attacks: 1102 },
  { country: 'Iran', code: 'IR', attacks: 987 },
  { country: 'North Korea', code: 'KP', attacks: 876 },
  { country: 'Nigeria', code: 'NG', attacks: 654 }
];
