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
      
      // Limit currencies to prevent abuse
      const currencies = args.currencies?.slice(0, 10).map(c => c.toUpperCase().slice(0, 10));
      
      // Limit results to prevent DoS
      const limit = Math.min(args.limit || 20, 50);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // CryptoPanic requires auth_token even for public access
      // Using a placeholder that triggers public mode
      params.append('auth_token', 'free');
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
      });

      if (!response.ok) {
        throw new Error(`CryptoPanic API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Sanitize response data
      const posts = (data.results || []).slice(0, limit).map((post: any) => ({
        id: String(post.id || '').slice(0, 50),
        title: String(post.title || '').slice(0, 300),
        url: String(post.url || '').slice(0, 500),
        created_at: String(post.created_at || ''),
        domain: String(post.domain || '').slice(0, 100),
        votes: {
          positive: Math.max(0, Math.min(Number(post.votes?.positive) || 0, 999999)),
          negative: Math.max(0, Math.min(Number(post.votes?.negative) || 0, 999999)),
          important: Math.max(0, Math.min(Number(post.votes?.important) || 0, 999999)),
        },
        currencies: (post.currencies || []).slice(0, 5).map((c: any) => ({
          code: String(c.code || '').slice(0, 10),
          title: String(c.title || '').slice(0, 50),
        })),
      }));

      return {
        success: true,
        posts,
        count: data.count,
      };
    } catch (error: any) {
      console.error('Error fetching CryptoPanic news:', error);
      return {
        success: false,
        error: error.message,
        posts: [],
        count: 0,
      };
    }
  },
});