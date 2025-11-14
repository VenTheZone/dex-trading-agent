# OpenRouter AI API - AI Model Integration

## Overview

The DeX Trading Agent uses **OpenRouter** as an AI gateway to access multiple large language models for market analysis and trading decisions. This document details the complete AI integration architecture, model selection, prompt engineering, response parsing, and cost optimization strategies.

**OpenRouter Base URL:** `https://openrouter.ai/api/v1`

**Supported Models:**
- **DeepSeek V3.1** (`deepseek/deepseek-chat-v3-0324:free`) - Free tier
- **Qwen3 Max** (`qwen/qwen3-max`) - Paid tier

**Last Updated:** November 15, 2025  
**Maintained By:** VenTheZone

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Model Selection](#model-selection)
3. [DeepSeekService Class](#deepseekservice-class)
4. [Market Analysis Workflow](#market-analysis-workflow)
5. [Prompt Engineering](#prompt-engineering)
6. [Response Parsing](#response-parsing)
7. [Multi-Chart Analysis](#multi-chart-analysis)
8. [Cost Optimization](#cost-optimization)
9. [Error Handling](#error-handling)
10. [Integration Patterns](#integration-patterns)
11. [Best Practices](#best-practices)

---

## 1. Architecture Overview

### AI Integration Flow

