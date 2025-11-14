# Deployment Guide - DeX Trading Agent

## 🏠 Local Deployment Only

**Important:** This project is designed exclusively for local deployment. All cloud deployment configurations have been removed to ensure security and privacy.

This guide covers running the DeX Trading Agent on your local machine. Choose between Docker (recommended) or manual setup.

---

## 🐳 Option 1: Docker Deployment (Recommended)

Docker provides an isolated, consistent environment across different machines.

### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- Docker Compose (included with Docker Desktop)
- Git

### Quick Start

1. **Clone the repository**
```
git clone https://github.com/VenTheZone/dex-trading-agent.git
cd dex-trading-agent
```

2. **Start the application**
```docker-compose up --build
```
