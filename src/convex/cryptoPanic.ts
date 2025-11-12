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
      // Build query parameters for public API access
      const params = new URLSearchParams();
      
      params.append('public', 'true');
      
      if (args.filter) {
        params.append('filter', args.filter);
      }
      
      if (args.currencies && args.currencies.length > 0) {
        params.append('currencies', args.currencies.join(','));
      }

      const url = `https://cryptopanic.com/api/v1/posts/?${params.toString()}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`CryptoPanic API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Limit results if specified
      const posts = args.limit 
        ? data.results.slice(0, args.limit)
        : data.results;

      return {
        success: true,
        posts: posts as CryptoPanicPost[],
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
