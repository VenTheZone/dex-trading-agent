import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router";
import { 
  ArrowLeft, 
  Book, 
  CheckCircle,
  Zap,
  Terminal,
  Cpu,
  Database,
  Globe,
  Shield,
  Code
} from "lucide-react";
import { TradingBackground } from "@/components/CyberpunkBackground";
import { WorkflowTab } from "@/components/documentation/WorkflowTab";
import { ArchitectureTab } from "@/components/documentation/ArchitectureTab";
import { FeaturesTab } from "@/components/documentation/FeaturesTab";
import { RiskManagementTab } from "@/components/documentation/RiskManagementTab";
import { TradingModesTab } from "@/components/documentation/TradingModesTab";
import { ApiReferenceTab } from "@/components/documentation/ApiReferenceTab";

export default function Documentation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("workflow");

  return (
    <div className="min-h-screen bg-black text-cyan-100 selection:bg-cyan-500/30 font-sans">
      <TradingBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 -ml-4 group font-mono"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Command Center
          </Button>
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-cyan-900/50 pb-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full group-hover:bg-cyan-500/30 transition-all duration-500" />
              <img 
                src="/logo.png" 
                alt="DeX Agent" 
                className="relative w-32 h-32 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(0,255,255,0.2)] group-hover:scale-105 transition-transform duration-500" 
              />
            </div>
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 text-xs font-mono">v2.0.0-beta</span>
                <span className="px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-400 text-xs font-mono">AI-Powered</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 font-mono tracking-tight">
                SYSTEM DOCS
              </h1>
              <p className="text-xl text-gray-400 font-mono max-w-2xl leading-relaxed">
                Comprehensive technical documentation for the DeX Trading Agent architecture, workflows, and risk protocols.
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Project Inspiration */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <Card className="h-full bg-gradient-to-br from-purple-950/20 to-black border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-purple-400 font-mono">
                    <Book className="h-5 w-5" />
                    Origin Story
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">
                    Born from the <span className="text-purple-300 font-bold">Nof1 Alpha Arena</span> competition. While others built basic bots, we engineered a system that understands the brutal reality of leverage.
                  </p>
                  <div className="p-3 rounded bg-purple-900/10 border border-purple-500/20">
                    <p className="text-xs text-purple-300 font-mono italic">
                      "Built by traders, for traders. Not just code, but strategy."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tech Stack Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2"
            >
              <Card className="h-full bg-black/50 border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-cyan-400 font-mono">
                    <Code className="h-5 w-5" />
                    Core Technology Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: Globe, label: "Frontend", val: "React 19", color: "cyan" },
                      { icon: Terminal, label: "Backend", val: "FastAPI", color: "purple" },
                      { icon: Database, label: "Data", val: "PostgreSQL", color: "green" },
                      { icon: Cpu, label: "AI Engine", val: "DeepSeek", color: "red" },
                      { icon: Shield, label: "Security", val: "Local Auth", color: "orange" },
                      { icon: Zap, label: "Speed", val: "Vite", color: "yellow" },
                      { icon: CheckCircle, label: "Testing", val: "Vitest", color: "blue" },
                      { icon: Code, label: "Styling", val: "Tailwind", color: "pink" },
                    ].map((item, i) => (
                      <div key={i} className={`p-3 rounded-lg bg-${item.color}-950/10 border border-${item.color}-500/20 hover:border-${item.color}-500/50 transition-all group`}>
                        <item.icon className={`h-5 w-5 text-${item.color}-400 mb-2 group-hover:scale-110 transition-transform`} />
                        <div className="text-xs text-gray-500 font-mono uppercase">{item.label}</div>
                        <div className={`text-sm font-bold text-${item.color}-300`}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="sticky top-4 z-50 bg-black/80 backdrop-blur-xl p-2 rounded-xl border border-cyan-500/20 shadow-2xl">
            <TabsList className="w-full h-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-transparent p-0">
              {[
                { id: "workflow", label: "Workflow", icon: "🔄" },
                { id: "architecture", label: "Architecture", icon: "🏗️" },
                { id: "features", label: "Features", icon: "✨" },
                { id: "risk", label: "Risk Mgmt", icon: "🛡️" },
                { id: "modes", label: "Modes", icon: "🎮" },
                { id: "api", label: "API Ref", icon: "🔌" },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id} 
                  className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(0,255,255,0.4)] text-gray-400 hover:text-cyan-400 hover:bg-cyan-950/30 border border-transparent data-[state=active]:border-cyan-400 transition-all duration-300 py-3 font-mono text-xs sm:text-sm"
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[600px]">
            <TabsContent value="workflow" className="mt-0 focus-visible:outline-none">
              <WorkflowTab onNavigate={setActiveTab} />
            </TabsContent>

            <TabsContent value="architecture" className="mt-0 focus-visible:outline-none">
              <ArchitectureTab onNavigate={setActiveTab} />
            </TabsContent>

            <TabsContent value="features" className="mt-0 focus-visible:outline-none">
              <FeaturesTab onNavigate={setActiveTab} />
            </TabsContent>

            <TabsContent value="risk" className="mt-0 focus-visible:outline-none">
              <RiskManagementTab onNavigate={setActiveTab} />
            </TabsContent>

            <TabsContent value="modes" className="mt-0 focus-visible:outline-none">
              <TradingModesTab onNavigate={setActiveTab} />
            </TabsContent>

            <TabsContent value="api" className="mt-0 focus-visible:outline-none">
              <ApiReferenceTab onNavigate={setActiveTab} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 text-center pb-12"
        >
          <div className="inline-block p-[1px] rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-black hover:bg-gray-900 text-cyan-400 font-bold font-mono rounded-full px-12 py-8 text-lg transition-all hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]"
            >
              <Zap className="mr-3 h-6 w-6 animate-pulse" />
              INITIALIZE TRADING SYSTEM
            </Button>
          </div>
          <p className="mt-4 text-gray-500 font-mono text-sm">
            Ready to deploy capital? Proceed with caution.
          </p>
        </motion.div>
      </div>
    </div>
  );
}