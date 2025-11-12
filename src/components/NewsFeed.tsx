import { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, TrendingUp, TrendingDown, Flame, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface NewsPost {
  id: string;
  title: string;
  url: string;
  created_at: string;
  domain: string;
  votes: {
    positive: number;
    negative: number;
    important: number;
  };
  currencies: Array<{
    code: string;
    title: string;
  }>;
}

export function NewsFeed() {
  const [news, setNews] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'hot' | 'bullish' | 'bearish' | 'important'>('hot');
  const fetchNews = useAction((api as any).cryptoPanic.fetchCryptoNews);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const result = await fetchNews({
        filter,
        currencies: ['BTC', 'ETH', 'SOL', 'AVAX'],
        limit: 20,
      });

      if (result.success) {
        setNews(result.posts);
      } else {
        toast.error('Failed to load news');
      }
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Failed to load crypto news');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    // Refresh every 5 minutes
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  const getFilterIcon = (filterType: string) => {
    switch (filterType) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />;
      case 'bearish': return <TrendingDown className="h-4 w-4" />;
      case 'important': return <Flame className="h-4 w-4" />;
      default: return <Flame className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (votes: NewsPost['votes']) => {
    const sentiment = votes.positive - votes.negative;
    if (sentiment > 5) return 'text-green-400';
    if (sentiment < -5) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="bg-black/90 border-cyan-500/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
          📰 Crypto News
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadNews}
            disabled={isLoading}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['hot', 'bullish', 'bearish', 'important'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={`font-mono ${
                filter === f
                  ? 'bg-cyan-500 text-black'
                  : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              {getFilterIcon(f)}
              <span className="ml-1 capitalize">{f}</span>
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading && news.length === 0 ? (
            <div className="text-center text-gray-500 py-8 font-mono">
              Loading news...
            </div>
          ) : news.length === 0 ? (
            <div className="text-center text-gray-500 py-8 font-mono">
              No news available
            </div>
          ) : (
            <div className="space-y-3">
              {news.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-black/50 border border-cyan-500/30 rounded-lg p-3 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-100 hover:text-cyan-400 font-mono text-sm font-medium line-clamp-2 flex items-start gap-2"
                      >
                        {post.title}
                        <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      </a>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {post.currencies.slice(0, 3).map((currency) => (
                          <Badge
                            key={currency.code}
                            variant="outline"
                            className="border-cyan-500/50 text-cyan-400 font-mono text-xs"
                          >
                            {currency.code}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                        <span className="text-gray-500">{post.domain}</span>
                        <span className="text-gray-500">{formatTimeAgo(post.created_at)}</span>
                        {post.votes.important > 0 && (
                          <span className="text-orange-400 flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {post.votes.important}
                          </span>
                        )}
                        <span className={getSentimentColor(post.votes)}>
                          {post.votes.positive > 0 && `+${post.votes.positive}`}
                          {post.votes.negative > 0 && ` -${post.votes.negative}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}