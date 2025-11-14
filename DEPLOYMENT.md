# Deployment Guide - DeX Trading Agent

## 🆓 Free Deployment Option: Render.com

This guide focuses on deploying to **Render.com's free tier**, which provides everything needed for this project at no cost.

### Render Free Tier Includes:
- ✅ Web Service (Docker support, auto-sleeps after 15min inactivity)
- ✅ PostgreSQL Database (free for 90 days, easily renewable)
- ✅ Redis Instance (free)
- ✅ GitHub auto-deploy
- ✅ Custom domains
- ✅ SSL certificates

**Note:** Free services auto-sleep after 15 minutes of inactivity and take ~30 seconds to wake up on first request.

---

## 🚀 Quick Deploy to Render (Free)

### Prerequisites
1. GitHub account with your repository
2. Render.com account (sign up at https://render.com)
3. API keys ready (Hyperliquid, OpenRouter, CryptoPanic)

### Step 1: Prepare Your Repository

Ensure these files exist in your repo (already included):
- `Dockerfile` (for backend)
- `render.yaml` (Render configuration)
- `.env.example` (environment variable template)

### Step 2: Connect to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create:
   - Web Service (FastAPI backend)
   - PostgreSQL Database
   - Redis Instance
   - Static Site (React frontend)

### Step 3: Configure Environment Variables

In Render Dashboard, set these environment variables for your **Web Service**:

**Required:**

**Hyperliquid API Key:**
- Variable Name: `HYPERLIQUID_API_KEY`
- Value: [Your Hyperliquid API Key]

**OpenRouter API Key:**
- Variable Name: `OPENROUTER_API_KEY`
- Value: [Your OpenRouter API Key]

**CryptoPanic API Key:**
- Variable Name: `CRYPTOPANIC_AUTH_TOKEN`
- Value: [Your CryptoPanic API Key]

**Optional:**
- `REACT_APP_API_URL` (if needed for frontend)

### Step 4: Wait for Deployment

Render will automatically deploy your application. The first request might take 30 seconds as the service wakes up from auto-sleep.

### Step 5: Access Your Application

Once deployed, your application will be accessible at:
- `https://<your-app-name>.render.com` (or custom domain)

---

## 🚀 Quick Deploy to Vercel (Free)

### Prerequisites
1. Vercel account (sign up at https://vercel.com)
2. Convex account with your project deployed
3. Git repository connected to Vercel

### Step 1: Generate Convex Deploy Keys

**For Production:**
1. Go to your Convex Dashboard (https://dashboard.convex.dev)
2. Select your project
3. Navigate to Settings → Deploy Keys
4. Generate a **Production Deploy Key**
5. Copy this key

**For Preview Deployments:**
1. In the same Deploy Keys section
2. Generate a **Preview Deploy Key**
3. Copy this key

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to Settings → Environment Variables
3. Add the following variables:

**Production Environment:**
- Variable Name: `CONVEX_DEPLOY_KEY`
- Value: [Your Production Deploy Key]
- Environment: **Production** only

**Preview Environment:**
- Variable Name: `CONVEX_DEPLOY_KEY`
- Value: [Your Preview Deploy Key]
- Environment: **Preview** only

**OpenRouter API Key (All Environments):**
- Variable Name: `OPENROUTER_API_KEY`
- Value: [Your OpenRouter API Key]
- Environment: **Production, Preview, Development**

**CryptoPanic API Key (All Environments):**
- Variable Name: `CRYPTOPANIC_AUTH_TOKEN`
- Value: [Your CryptoPanic API Key]
- Environment: **Production, Preview, Development**

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI

---

# Docker Deployment Guide (Local Development)

## Overview

This guide covers deploying the DeX Trading Agent locally using Docker for development and testing purposes. Docker provides an isolated, consistent environment across different machines.

## Prerequisites

1. **Docker Desktop** installed (https://www.docker.com/products/docker-desktop)
2. **Docker Compose** (included with Docker Desktop)
3. **Convex account** with your project deployed
4. **API Keys** (OpenRouter, CryptoPanic)

## Quick Start

### 1. Set Up Convex Backend

Before using Docker, you need to deploy your Convex backend:

1. Go to your Convex Dashboard (https://dashboard.convex.dev)
2. Select your project
3. Click "Deploy" to deploy your Convex backend
4. Wait for deployment to complete
5. Copy your `CONVEX_DEPLOYMENT_URL` from the dashboard

### 2. Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):
