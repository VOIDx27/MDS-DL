// ═══════════════════════════════════════════════════════════════════════════════
// ScamShastra — Pattern Analysis Queries (Neo4j GDS + Path Algorithms)
// ═══════════════════════════════════════════════════════════════════════════════


// ─── 1. Shortest Path Between Suspects ──────────────────────────────────────
//
// MATCH path = shortestPath(
//   (a:Account {vpa: $vpaA})-[:SENT*]-(b:Account {vpa: $vpaB})
// )
// RETURN path,
//        length(path) AS hops,
//        [rel IN relationships(path) | rel.amount] AS amounts;


// ─── 2. All Shortest Paths (multiple routes = stronger link) ────────────────
//
// MATCH path = allShortestPaths(
//   (a:Account {vpa: $vpaA})-[:SENT*..10]-(b:Account {vpa: $vpaB})
// )
// RETURN path, length(path) AS hops
// ORDER BY hops
// LIMIT 20;


// ─── 3. Community Detection via Louvain ─────────────────────────────────────
// Project the SENT network into GDS and identify tightly-knit clusters.
//
// CALL gds.graph.project('fraud-sent-net', 'Account', 'SENT',
//   {relationshipProperties: 'amount'}
// );
//
// CALL gds.louvain.stream('fraud-sent-net')
// YIELD nodeId, communityId
// RETURN gds.util.asNode(nodeId).vpa AS vpa,
//        communityId
// ORDER BY communityId, vpa;


// ─── 4. PageRank — Most "Influential" Accounts ─────────────────────────────
// High PageRank = many accounts send money toward this node.
//
// CALL gds.pageRank.stream('fraud-sent-net', {maxIterations: 20, dampingFactor: 0.85})
// YIELD nodeId, score
// RETURN gds.util.asNode(nodeId).vpa AS vpa,
//        gds.util.asNode(nodeId).bank AS bank,
//        score
// ORDER BY score DESC
// LIMIT 25;


// ─── 5. Betweenness Centrality — Key Intermediaries ─────────────────────────
// Accounts that sit on many shortest paths (brokers / pass-through mules).
//
// CALL gds.betweenness.stream('fraud-sent-net')
// YIELD nodeId, score
// RETURN gds.util.asNode(nodeId).vpa AS vpa,
//        score AS betweenness
// ORDER BY betweenness DESC
// LIMIT 25;


// ─── 6. Weakly Connected Components ─────────────────────────────────────────
// Find isolated sub-networks — a component with many flagged accounts is suspicious.
//
// CALL gds.wcc.stream('fraud-sent-net')
// YIELD nodeId, componentId
// WITH componentId, collect(gds.util.asNode(nodeId)) AS members
// WHERE size(members) >= 3
// RETURN componentId,
//        size(members) AS memberCount,
//        [m IN members | m.vpa] AS vpas,
//        [m IN members WHERE m.isFlagged | m.vpa] AS flaggedVpas
// ORDER BY memberCount DESC;


// ─── 7. Transaction Velocity per Account (time-windowed) ────────────────────
//
// MATCH (a:Account)-[s:SENT]->()
// WHERE s.timestamp > datetime() - duration({hours: $windowHours})
// WITH a,
//      COUNT(s)    AS txnCount,
//      SUM(s.amount) AS totalVolume,
//      MIN(s.timestamp) AS firstTx,
//      MAX(s.timestamp) AS lastTx
// WHERE txnCount > $threshold
// RETURN a.vpa, a.muleScore, txnCount, totalVolume, firstTx, lastTx
// ORDER BY txnCount DESC;


// ─── Cleanup GDS projection ─────────────────────────────────────────────────
// CALL gds.graph.drop('fraud-sent-net', false);

