"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

interface CryptoPanicPost {
  id: string;
  title: string;
  url: string;
  created_at: string;
  published_at: string;
  domain: string;
  votes: {
    positive: number;
    negative: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
    comments: number;
  };
  currencies: Array<{
    code: string;
    title: string;
    slug: string;
    url: string;
  }>;
}

export const fetchCryptoNews = action({
  args: {
    filter: v.optional(v.string()),
    currencies: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Validate and sanitize inputs
      const validFilters = ['hot', 'bullish', 'bearish', 'important', 'saved', 'lol'];
      const filter = args.filter && validFilters.includes(args.filter) ? args.filter : undefined;
      
      // Limit currencies to prevent abuse (max 10)
      const currencies = args.currencies?.slice(0, 10).map(c => {
        const sanitized = String(c).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        return sanitized;
      }).filter(c => c.length > 0);
      
      // Limit results to prevent DoS (max 50)
      const limit = Math.max(1, Math.min(args.limit || 20, 50));
      
      // Build query parameters for public API access
      const params = new URLSearchParams();
      
      // Public API access - no auth_token required for basic access
      // If CRYPTOPANIC_AUTH_TOKEN is set, use it for higher rate limits
      const authToken = process.env.CRYPTOPANIC_AUTH_TOKEN;
      if (authToken && authToken !== 'free') {
        params.append('auth_token', authToken);
      }
      
      // Always set public=true for public posts
      params.append('public', 'true');
      
      if (filter) {
        params.append('filter', filter);
      }
      
      if (currencies && currencies.length > 0) {
        params.append('currencies', currencies.join(','));
      }

      const url = `https://cryptopanic.com/api/v1/posts/?${params.toString()}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DeX-Trading-Agent/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`CryptoPanic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
        throw new Error('Invalid API response structure');
      }
      
      // Sanitize response data with strict validation
      const posts = (data.results || []).slice(0, limit).map((post: any) => {
        if (!post || typeof post !== 'object') return null;
        
        return {
          id: String(post.id || '').replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 50),
          title: String(post.title || '').replace(/<[^>]*>/g, '').slice(0, 300),
          url: String(post.url || '').slice(0, 500),
          created_at: String(post.created_at || ''),
          domain: String(post.domain || '').replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 100),
          votes: {
            positive: Math.max(0, Math.min(Number(post.votes?.positive) || 0, 999999)),
            negative: Math.max(0, Math.min(Number(post.votes?.negative) || 0, 999999)),
            important: Math.max(0, Math.min(Number(post.votes?.important) || 0, 999999)),
          },
          currencies: (Array.isArray(post.currencies) ? post.currencies : []).slice(0, 5).map((c: any) => ({
            code: String(c?.code || '').replace(/[^A-Z0-9]/g, '').slice(0, 10),
            title: String(c?.title || '').replace(/<[^>]*>/g, '').slice(0, 50),
          })).filter((c: any) => c.code.length > 0),
        };
      }).filter((post: any) => post !== null && post.id && post.title && post.url);

      return {
        success: true,
        posts,
        count: Math.min(data.count || 0, 999999),
      };
    } catch (error: any) {
      console.error('Error fetching CryptoPanic news:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        posts: [],
        count: 0,
      };
    }
  },
});