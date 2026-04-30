# ScamShastra API Documentation

## Overview

The backend is built with FastAPI. This document outlines the planned API endpoints.

## Endpoints

### Entities
- `GET /api/v1/entities/{id}`: Get details of a specific entity (User, Account, Device)
- `GET /api/v1/entities/search`: Search entities by various attributes

### Transactions
- `GET /api/v1/transactions`: Fetch transactions with filtering options

### Graph Analytics
- `GET /api/v1/graph/mule-rings`: Detect and retrieve potential money mule rings
- `GET /api/v1/graph/shortest-path`: Find shortest paths between two suspicious entities

