import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Download, ExternalLink } from "lucide-react";
import { checkForUpdates, getUpdateInstructions, type VersionInfo } from "@/lib/version-checker";
import { toast } from "sonner";

export function UpdateNotification() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isDocker] = useState(() => {
    // Detect if running in Docker (you can set this via env var)
    return import.meta.env.VITE_DOCKER_DEPLOYMENT === "true";
  });

  useEffect(() => {
    // Check for updates on mount
    checkForUpdates()
      .then((info) => {
        if (info?.updateAvailable) {
          setVersionInfo(info);
          toast.info(`Update available: v${info.latestVersion}`, {
            duration: 5000,
          });
        }
      })
      .catch(console.error);
  }, []);

  if (!versionInfo?.updateAvailable || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <Card className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-cyan-400 font-mono flex items-center gap-2">
                <Download className="h-5 w-5" />
                Update Available
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDismissed(true)}
                className="text-cyan-400 hover:bg-cyan-500/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-cyan-100 font-mono">
              <p>
                Current: <span className="text-gray-400">v{versionInfo.currentVersion}</span>
              </p>
              <p>
                Latest: <span className="text-green-400">v{versionInfo.latestVersion}</span>
              </p>
            </div>

            {versionInfo.releaseNotes && (
              <div className="text-xs text-gray-400 max-h-20 overflow-y-auto custom-scrollbar">
                {versionInfo.releaseNotes.split("\n").slice(0, 3).join("\n")}
              </div>
            )}

            <div className="bg-black/50 rounded p-3 text-xs text-cyan-100 font-mono">
              <pre className="whitespace-pre-wrap">
                {getUpdateInstructions(isDocker)}
              </pre>
            </div>

            <Button
              onClick={() => window.open(versionInfo.releaseUrl, "_blank")}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold font-mono"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Release Notes
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}