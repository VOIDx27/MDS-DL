// ═══════════════════════════════════════════════════════════════════════════════
// FraudGraph — Neo4j Schema Definition
// UPI Fraud Detection & Money Mule Network Mapper
//
// Node labels : Account, Transaction, Device, FraudRing
// Relationships: SENT, USES, MEMBER_OF, LINKED_TO
// ═══════════════════════════════════════════════════════════════════════════════


// ─── UNIQUENESS CONSTRAINTS ──────────────────────────────────────────────────

// Every Account is uniquely identified by its internal id
CREATE CONSTRAINT account_id_unique IF NOT EXISTS
  FOR (a:Account) REQUIRE a.id IS UNIQUE;

// Every Account has a unique UPI Virtual Payment Address
CREATE CONSTRAINT account_vpa_unique IF NOT EXISTS
  FOR (a:Account) REQUIRE a.vpa IS UNIQUE;

// Every Transaction is uniquely identified by its UPI Transaction Reference
CREATE CONSTRAINT transaction_utr_unique IF NOT EXISTS
  FOR (t:Transaction) REQUIRE t.utr IS UNIQUE;

// Every Device is uniquely identified by its IMEI
CREATE CONSTRAINT device_imei_unique IF NOT EXISTS
  FOR (d:Device) REQUIRE d.imei IS UNIQUE;

// Every FraudRing is uniquely identified by its ringId
CREATE CONSTRAINT fraudring_id_unique IF NOT EXISTS
  FOR (r:FraudRing) REQUIRE r.ringId IS UNIQUE;


// ─── NODE PROPERTY INDEXES ───────────────────────────────────────────────────

// Account indexes — fast lookups for investigation queries
CREATE INDEX account_bank IF NOT EXISTS
  FOR (a:Account) ON (a.bank);

CREATE INDEX account_kyctier IF NOT EXISTS
  FOR (a:Account) ON (a.kycTier);

CREATE INDEX account_mulescore IF NOT EXISTS
  FOR (a:Account) ON (a.muleScore);

CREATE INDEX account_isflagged IF NOT EXISTS
  FOR (a:Account) ON (a.isFlagged);

CREATE INDEX account_ringid IF NOT EXISTS
  FOR (a:Account) ON (a.ringId);

CREATE INDEX account_mobilehash IF NOT EXISTS
  FOR (a:Account) ON (a.mobileHash);

CREATE INDEX account_createdat IF NOT EXISTS
  FOR (a:Account) ON (a.createdAt);

// Transaction indexes — time-range scans and status filtering
CREATE INDEX transaction_timestamp IF NOT EXISTS
  FOR (t:Transaction) ON (t.timestamp);

CREATE INDEX transaction_status IF NOT EXISTS
  FOR (t:Transaction) ON (t.status);

CREATE INDEX transaction_amount IF NOT EXISTS
  FOR (t:Transaction) ON (t.amount);

CREATE INDEX transaction_city IF NOT EXISTS
  FOR (t:Transaction) ON (t.city);

CREATE INDEX transaction_upiapp IF NOT EXISTS
  FOR (t:Transaction) ON (t.upiApp);

// Composite index — filter transactions by status + time window
CREATE INDEX transaction_status_time IF NOT EXISTS
  FOR (t:Transaction) ON (t.status, t.timestamp);

// Device indexes
CREATE INDEX device_model IF NOT EXISTS
  FOR (d:Device) ON (d.model);

// FraudRing indexes
CREATE INDEX fraudring_status IF NOT EXISTS
  FOR (r:FraudRing) ON (r.status);

CREATE INDEX fraudring_detectedat IF NOT EXISTS
  FOR (r:FraudRing) ON (r.detectedAt);


// ─── RELATIONSHIP PROPERTY INDEXES ───────────────────────────────────────────

// Fast lookup of SENT edges by UTR (trace a single payment)
CREATE INDEX sent_utr IF NOT EXISTS
  FOR ()-[s:SENT]-() ON (s.utr);

// Range scan on SENT amount (find high-value transfers)
CREATE INDEX sent_amount IF NOT EXISTS
  FOR ()-[s:SENT]-() ON (s.amount);

// Range scan on SENT timestamp (windowed queries)
CREATE INDEX sent_timestamp IF NOT EXISTS
  FOR ()-[s:SENT]-() ON (s.timestamp);
