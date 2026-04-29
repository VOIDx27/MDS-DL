# FraudGraph Architecture

FraudGraph is a full-stack investigative intelligence platform designed to detect UPI payment fraud, specifically targeting money mule networks.

## Components

1. **Frontend**: React 18 + TypeScript + Vite. Provides the investigative dashboard.
2. **Backend**: FastAPI (Python). Serves REST APIs and coordinates data fetching.
3. **Graph Engine**: Neo4j. Stores entities (Users, Accounts, Devices, Transactions) and relationships to detect rings.
4. **Stream Processor**: Apache Flink + Kafka. Processes real-time UPI transaction streams for anomaly detection.
5. **Simulation**: Python faker scripts to generate synthetic transactions mimicking fraud typologies.
6. **Shared**: Shared schemas and types across the stack.

## Data Flow

`Simulation` -> `Kafka` -> `Flink (Stream Processor)` -> `Kafka / Neo4j` -> `Backend` -> `Frontend`
