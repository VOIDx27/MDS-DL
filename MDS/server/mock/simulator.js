// ============================================================
// MDS-DL Simulator — Produces realistic ML inference results
// ============================================================

import { malwareFamilies, attackTechniques } from './data.js';
import { v4 as uuidv4 } from 'uuid';

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr, count = 1) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateSHAPValues() {
  const features = [
    'entropy_section_text', 'import_count', 'export_count',
    'section_count', 'pe_timestamp_anomaly', 'string_url_count',
    'byte_ngram_suspicious', 'header_size_ratio', 'resource_entropy',
    'debug_info_stripped', 'tls_callback_present', 'relocation_stripped',
    'packed_indicator', 'api_call_frequency', 'registry_write_count'
  ];

  return features.map(f => ({
    feature: f,
    value: randomFloat(-0.15, 0.35),
    importance: randomFloat(0, 1)
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function generatePEHeaders() {
  return {
    machine: '0x14c (i386)',
    numberOfSections: randomInt(3, 8),
    timeDateStamp: '2026-03-' + randomInt(1, 31).toString().padStart(2, '0') + 'T' + randomInt(0, 23) + ':00:00Z',
    characteristics: ['EXECUTABLE_IMAGE', 'LARGE_ADDRESS_AWARE', randomFloat(0, 1) > 0.5 ? 'DLL' : '32BIT_MACHINE'],
    entryPoint: '0x' + randomInt(4096, 65536).toString(16),
    imageBase: '0x00400000',
    sections: [
      { name: '.text', virtualSize: randomInt(20000, 500000), entropy: randomFloat(5.5, 7.8).toFixed(2) },
      { name: '.rdata', virtualSize: randomInt(10000, 200000), entropy: randomFloat(4.0, 6.5).toFixed(2) },
      { name: '.data', virtualSize: randomInt(5000, 100000), entropy: randomFloat(1.0, 5.0).toFixed(2) },
      { name: '.rsrc', virtualSize: randomInt(1000, 50000), entropy: randomFloat(3.0, 7.5).toFixed(2) }
    ],
    imports: [
      'kernel32.dll', 'user32.dll', 'advapi32.dll', 'ws2_32.dll',
      'ntdll.dll', 'ole32.dll', 'crypt32.dll'
    ].slice(0, randomInt(3, 7)),
    suspiciousImports: [
      'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread',
      'NtUnmapViewOfSection', 'SetWindowsHookEx', 'InternetOpenA'
    ].slice(0, randomInt(0, 4))
  };
}

function generateBehavioralAnalysis() {
  const apiCalls = [
    'CreateFileW', 'WriteFile', 'RegSetValueExW', 'CreateProcessW',
    'VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread',
    'InternetConnectA', 'HttpSendRequestA', 'CryptEncrypt',
    'NtCreateThreadEx', 'LoadLibraryA', 'GetProcAddress'
  ];

  const networkActivity = [
    { type: 'DNS', destination: `c2-${randomInt(1, 99)}.malware-cdn.ru`, port: 53, protocol: 'UDP' },
    { type: 'HTTP', destination: `${randomInt(45, 200)}.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`, port: 8080, protocol: 'TCP' },
    { type: 'HTTPS', destination: `exfil-${randomInt(1, 50)}.darknet.io`, port: 443, protocol: 'TCP' }
  ];

  const fileActivity = [
    { action: 'CREATE', path: `C:\\Users\\victim\\AppData\\Local\\Temp\\${uuidv4().slice(0, 8)}.tmp` },
    { action: 'WRITE', path: 'C:\\Windows\\System32\\drivers\\etc\\hosts' },
    { action: 'DELETE', path: `C:\\Users\\victim\\Downloads\\original_${randomInt(1, 999)}.exe` }
  ];

  return {
    apiCallSequence: pickRandom(apiCalls, randomInt(5, 10)),
    networkActivity: pickRandom(networkActivity, randomInt(1, 3)),
    fileActivity: pickRandom(fileActivity, randomInt(1, 3)),
    registryActivity: [
      { action: 'SET', key: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', value: 'svchost_update' },
      { action: 'SET', key: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\MalService', value: 'C:\\malware.exe' }
    ].slice(0, randomInt(0, 2)),
    processInjection: randomFloat(0, 1) > 0.5,
    memoryInjection: randomFloat(0, 1) > 0.6,
    antiAnalysis: randomFloat(0, 1) > 0.4
  };
}

export function simulateAnalysis(filename, fileSize) {
  const isMalicious = randomFloat(0, 1) > 0.3;
  const family = isMalicious ? pickRandom(malwareFamilies, 1)[0] : null;
  const techniques = isMalicious ? pickRandom(attackTechniques, randomInt(2, 5)) : [];
  const confidence = isMalicious ? randomFloat(0.82, 0.999) : randomFloat(0.001, 0.12);

  const modelScores = {
    malconv: { score: isMalicious ? randomFloat(0.75, 0.99) : randomFloat(0.01, 0.15), latency: randomInt(30, 150) },
    behaviorBert: { score: isMalicious ? randomFloat(0.70, 0.98) : randomFloat(0.02, 0.18), latency: randomInt(80, 250) },
    gnnSage: { score: isMalicious ? randomFloat(0.65, 0.97) : randomFloat(0.01, 0.20), latency: randomInt(100, 400) },
    visionResnet: { score: isMalicious ? randomFloat(0.60, 0.96) : randomFloat(0.03, 0.22), latency: randomInt(25, 100) },
    ensembleMeta: { score: confidence, latency: randomInt(5, 25) }
  };

  const totalLatency = Object.values(modelScores).reduce((s, m) => s + m.latency, 0);

  return {
    id: 'analysis-' + uuidv4(),
    filename,
    fileSize: fileSize || randomInt(1024, 10485760),
    fileType: detectFileType(filename),
    hash: {
      md5: [...Array(32)].map(() => '0123456789abcdef'[randomInt(0, 15)]).join(''),
      sha1: [...Array(40)].map(() => '0123456789abcdef'[randomInt(0, 15)]).join(''),
      sha256: [...Array(64)].map(() => '0123456789abcdef'[randomInt(0, 15)]).join('')
    },
    verdict: isMalicious ? 'malicious' : 'benign',
    confidence: parseFloat(confidence.toFixed(4)),
    severity: isMalicious ? family.severity : 'none',
    family: family ? { id: family.id, name: family.name, category: family.category } : null,
    techniques: techniques.map(t => ({ id: t.id, tactic: t.tactic, name: t.name })),
    modelScores,
    totalLatency,
    peHeaders: generatePEHeaders(),
    behavioralAnalysis: isMalicious ? generateBehavioralAnalysis() : null,
    shapValues: generateSHAPValues(),
    timestamp: new Date().toISOString()
  };
}

function detectFileType(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const map = {
    exe: 'PE32', dll: 'DLL', sys: 'Driver', msi: 'MSI',
    docm: 'Office Macro', xlsm: 'Office Macro', pptm: 'Office Macro',
    doc: 'Office', xls: 'Office', pdf: 'PDF',
    ps1: 'PowerShell', bat: 'Batch', cmd: 'Batch', vbs: 'VBScript',
    js: 'JavaScript', py: 'Python', jar: 'Java Archive',
    apk: 'Android APK', elf: 'ELF', so: 'Shared Object',
    zip: 'Archive', rar: 'Archive', '7z': 'Archive',
    iso: 'Disk Image', img: 'Disk Image'
  };
  return map[ext] || 'Unknown';
}

export function generateLiveDetection() {
  const filenames = [
    'update_service.exe', 'invoice_042026.docm', 'setup_patch.msi',
    'config_backup.ps1', 'report_q1.pdf', 'driver_update.sys',
    'photo_2026.jpg.exe', 'meeting_notes.doc', 'crack_v2.exe',
    'firmware_v3.2.bin', 'database_dump.sql', 'certificate.pfx'
  ];
  const sources = ['EDR Agent', 'Email Gateway', 'Web Proxy', 'API Upload', 'Sandbox', 'SIEM Connector'];
  const filename = pickRandom(filenames, 1)[0];
  const result = simulateAnalysis(filename, randomInt(1024, 5242880));
  result.source = pickRandom(sources, 1)[0];
  return result;
}
