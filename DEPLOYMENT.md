# Vercel Deployment Guide

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. A Convex account with your project deployed
3. Git repository connected to Vercel

## Setup Steps

### 1. Generate Convex Deploy Keys

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

### 2. Configure Vercel Environment Variables

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

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

---

# Docker Deployment Guide (Local Development)

## Overview

This guide covers deploying the DeX Trading Agent locally using Docker for development and testing purposes. Docker provides an isolated, consistent environment across different machines.

## Prerequisites

1. **Docker Desktop** installed (https://www.docker.com/products/docker-desktop)
2. **Docker Compose** (included with Docker Desktop)
3. **Convex account** with your project deployed
4. **API Keys** (OpenRouter, Hyperliquid)

## Quick Start

### 1. Set Up Convex Backend

Before using Docker, you need to deploy your Convex backend:

1. Go to your Convex Dashboard (https://dashboard.convex.dev)
2. Select your project
3. Click "Deploy" to deploy your Convex backend
4. Wait for deployment to complete

Once your Convex backend is deployed, you can proceed with the Docker setup.