import { motion } from 'framer-motion';

export const TradingBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Animated scan lines */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #00ffff 0px, transparent 2px, transparent 4px)',
        }}
        animate={{ y: [0, 20] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #00ffff 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #ff0080 0%, transparent 70%)' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </div>
  );
}