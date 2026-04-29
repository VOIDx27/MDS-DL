import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import type { GraphData, GraphNode } from "./types";
import { nodeSize, NODE_COLORS, EDGE_COLORS } from "./utils/colors";

interface Props {
  data: GraphData;
  onNodeClick: (nodeId: string) => void;
  onNodeHover: (node: GraphNode | null, x?: number, y?: number) => void;
}

export const SigmaRenderer: React.FC<Props> = ({ data, onNodeClick, onNodeHover }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph();

    // Map nodes
    const nodeMap = new Map<string, GraphNode>();
    data.nodes.forEach((n) => {
      nodeMap.set(n.id, n);
      graph.addNode(n.id, {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: nodeSize(n) / 2, // scale down slightly for sigma
        color: NODE_COLORS[n.risk || "normal"],
        label: n.vpa,
      });
    });

    // Map edges
    data.edges.forEach((e) => {
      // Avoid duplicate edges or edges missing nodes
      if (graph.hasNode(e.source) && graph.hasNode(e.target)) {
        if (!graph.hasEdge(e.source, e.target)) {
          graph.addEdge(e.source, e.target, {
            size: e.width || 1,
            color: EDGE_COLORS[e.edgeType || "normal"],
            type: "arrow",
          });
        }
      }
    });

    // Run layout
    forceAtlas2.assign(graph, { iterations: 100, settings: { barnesHutOptimize: true, gravity: 0.1 } });

    // Initialize Sigma
    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      allowInvalidContainer: true,
      defaultEdgeType: "arrow",
    });
    
    sigmaRef.current = sigma;

    // Events
    sigma.on("clickNode", ({ node }) => {
      onNodeClick(node);
    });

    sigma.on("enterNode", ({ node }) => {
      const pos = sigma.getNodeDisplayData(node);
      const nData = nodeMap.get(node);
      if (pos && nData) {
        onNodeHover(nData, pos.x, pos.y);
      }
    });

    sigma.on("leaveNode", () => {
      onNodeHover(null);
    });

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
  }, [data, onNodeClick, onNodeHover]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};
