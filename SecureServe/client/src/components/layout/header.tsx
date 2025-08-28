import { Button } from "@/components/ui/button";
import { Plus, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export default function Header({ title, description, action }: HeaderProps) {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-effect border-b border-white/20 px-6 py-6 backdrop-blur-xl bg-white/60"
    >
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 mt-2 text-lg">{description}</p>
          )}
        </motion.div>
        {action && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center space-x-6"
          >
            <div className="text-right bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium mb-1">
                <Clock className="w-4 h-4" />
                <span>Current Time</span>
              </div>
              <p className="font-bold text-slate-900 text-lg" data-testid="text-current-time">
                {new Date().toLocaleTimeString('en-US', { 
                  hour12: true, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={action.onClick}
                className="font-semibold px-6 py-3 gradient-primary text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {action.icon || <Plus className="mr-2 h-5 w-5" />}
                {action.label}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
