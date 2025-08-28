import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-600 mt-1">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-500">Current Time</p>
              <p className="font-medium text-slate-900" data-testid="text-current-time">
                {new Date().toLocaleTimeString('en-US', { 
                  hour12: true, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <Button 
              onClick={action.onClick}
              className="font-medium"
              data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {action.icon || <Plus className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
