// ═══════════════════════════════════════════════════════════════════════════════
// ScamShastra — Mule Detection Queries (aligned to schema.cypher)
// ═══════════════════════════════════════════════════════════════════════════════


// ─── 1. Circular Transaction Chains (Smurfing / Round-trip Rings) ────────────
// Finds cycles of 3–6 hops where money returns to the originator.
//
// MATCH path = (a:Account)-[:SENT*3..6]->(a)
// WHERE ALL(r IN relationships(path) WHERE r.amount > 1000)
// RETURN a.vpa AS origin,
//        length(path) AS hops,
//        [r IN relationships(path) | r.amount] AS amounts,
//        path
// ORDER BY hops DESC
// LIMIT 50;


// ─── 2. High Fan-In Accounts (Collector Pattern) ────────────────────────────
// Accounts receiving from many unique senders in a 24-hour window.
//
// MATCH (sender:Account)-[s:SENT]->(receiver:Account)
// WHERE s.timestamp > datetime() - duration({hours: 24})
// WITH receiver,
//      COUNT(DISTINCT sender) AS uniqueSenders,
//      SUM(s.amount)          AS totalInflow
// WHERE uniqueSenders > 10
// RETURN receiver.vpa   AS collectorVpa,
//        receiver.bank  AS bank,
//        uniqueSenders,
//        totalInflow
// ORDER BY uniqueSenders DESC;


// ─── 3. Rapid Pass-Through (Layering Detection) ─────────────────────────────
// Accounts that receive and immediately forward ≥90% of the amount
// within 30 minutes — classic mule/layering behavior.
//
// MATCH (a:Account)-[t1:SENT]->(mule:Account)-[t2:SENT]->(b:Account)
// WHERE t2.timestamp > t1.timestamp
//   AND duration.between(t1.timestamp, t2.timestamp).minutes < 30
//   AND t2.amount >= t1.amount * 0.9
// RETURN mule.vpa       AS muleVpa,
//        mule.muleScore AS currentScore,
//        COUNT(*)       AS passThroughCount,
//        SUM(t1.amount) AS totalValue
// ORDER BY passThroughCount DESC;


// ─── 4. Shared-Device Clusters ──────────────────────────────────────────────
// Find accounts that share a device — strong indicator of same operator.
//
// MATCH (a:Account)-[:USES]->(d:Device)<-[:USES]-(b:Account)
// WHERE a.vpa < b.vpa                // deduplicate pairs
// RETURN d.imei          AS sharedDevice,
//        d.model         AS deviceModel,
//        a.vpa           AS account1,
//        b.vpa           AS account2,
//        a.muleScore     AS score1,
//        b.muleScore     AS score2
// ORDER BY (a.muleScore + b.muleScore) DESC;


// ─── 5. Fraud Ring Subgraph Expansion ───────────────────────────────────────
// Given a ringId, retrieve the full member network and inter-member txns.
//
// MATCH (a:Account)-[:MEMBER_OF]->(r:FraudRing {ringId: $ringId})
// WITH collect(a) AS members, r
// UNWIND members AS m1
// UNWIND members AS m2
// OPTIONAL MATCH (m1)-[s:SENT]->(m2)
// RETURN r.ringId         AS ringId,
//        r.status         AS ringStatus,
//        m1.vpa           AS sender,
//        m2.vpa           AS receiver,
//        s.amount         AS amount,
//        s.timestamp      AS timestamp
// ORDER BY s.timestamp;


// ─── 6. LINKED_TO Cluster Expansion ─────────────────────────────────────────
// Traverse shared-mobile links up to 3 hops from a suspect account.
//
// MATCH path = (a:Account {vpa: $targetVpa})-[:LINKED_TO*1..3]-(b:Account)
// RETURN path, b.vpa AS linkedAccount, b.muleScore
// ORDER BY b.muleScore DESC;


// ─── 7. Accounts with NONE KYC and High Mule Score ─────────────────────────
// Quick hit-list for compliance teams.
//
// MATCH (a:Account)
// WHERE a.kycTier = 'NONE'
//   AND a.muleScore > 0.5
// RETURN a.vpa, a.bank, a.muleScore, a.accountAge, a.ringId
// ORDER BY a.muleScore DESC;

