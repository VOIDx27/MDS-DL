import React, { useState } from "react";
import { GraphCanvas } from "./components/GraphCanvas";

function App() {
  const [activeTab, setActiveTab] = useState("network");

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">S</div>
          <div className="logo-text">
            <span className="brand">SCAM</span>
            <span className="suffix">SHASTRA</span>
          </div>
        </div>
        <nav className="header-nav">
          <button className={activeTab === 'network' ? 'active' : ''} onClick={() => setActiveTab('network')}>Network Mapper</button>
          <button className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>Alert Queue</button>
          <button className={activeTab === 'compliance' ? 'active' : ''} onClick={() => setActiveTab('compliance')}>Compliance Reporting</button>
        </nav>
        <div className="header-actions">
          <div className="user-profile">
            <span className="user-name">Investigator #42</span>
            <div className="user-avatar"></div>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <h3>Active Investigations</h3>
            <ul className="investigation-list">
              <li className="active">Mule Ring #812 - Bangalore Cluster</li>
              <li>Layering Chain - Axis Bank Leak</li>
              <li>Account Takeover - UPI Spoof</li>
            </ul>
          </div>
          <div className="sidebar-section mt-auto">
            <div className="system-health">
              <div className="health-item">
                <span>Neo4j Engine</span>
                <span className="status ok">Online</span>
              </div>
              <div className="health-item">
                <span>Flink Stream</span>
                <span className="status ok">Processing</span>
              </div>
              <div className="health-item">
                <span>Kafka Bus</span>
                <span className="status ok">Healthy</span>
              </div>
            </div>
          </div>
        </aside>
        
        <section className="app-content">
          <GraphCanvas />
        </section>
      </main>
    </div>
  );
}

export default App;
