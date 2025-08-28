import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  University, 
  LayoutDashboard, 
  Handshake, 
  Users, 
  Package, 
  UserCog, 
  ClipboardList,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  roles?: string[];
}

function NavItem({ href, icon, label, badge, roles }: NavItemProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Check if user has required role
  if (roles && user && !roles.includes(user.role)) {
    return null;
  }

  const isActive = location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative flex items-center px-4 py-3 text-white/70 hover:text-white rounded-xl transition-all duration-300 cursor-pointer group",
          isActive && "text-white bg-white/10 shadow-lg backdrop-blur-sm"
        )}
        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {/* Background glow effect for active item */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-bg"
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
        )}
        
        <div className="relative z-10 w-5 h-5 mr-3">{icon}</div>
        <span className="relative z-10 flex-1 font-medium">{label}</span>
        
        {badge !== undefined && badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative z-10 ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg"
          >
            {badge}
          </motion.span>
        )}
        
        {!isActive && (
          <ChevronRight className="relative z-10 w-4 h-4 ml-auto opacity-0 group-hover:opacity-60 transition-opacity duration-200" />
        )}
      </motion.div>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navigationItems: NavItemProps[] = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard />,
      label: "Dashboard",
    },
    {
      href: "/loans", 
      icon: <Handshake />,
      label: "Loans",
    },
    {
      href: "/students",
      icon: <Users />,
      label: "Students",
    },
    {
      href: "/items",
      icon: <Package />,
      label: "Inventory",
    },
    {
      href: "/users",
      icon: <UserCog />,
      label: "User Management",
      roles: ["ADMIN"],
    },
    {
      href: "/audit",
      icon: <ClipboardList />,
      label: "Audit Log",
    },
  ];

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-64 gradient-primary flex flex-col relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl transform -translate-x-16 translate-y-16"></div>
      </div>

      {/* Logo */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="p-6 border-b border-white/20 relative z-10"
      >
        <div className="flex items-center space-x-3">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg"
          >
            <University className="text-white text-xl" />
          </motion.div>
          <div>
            <h2 className="text-white font-bold text-lg">UniRes</h2>
            <p className="text-white/70 text-sm">Reception Desk</p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
        {navigationItems.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          >
            <NavItem {...item} />
          </motion.div>
        ))}
      </nav>

      {/* User Profile */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="p-4 border-t border-white/20 relative z-10"
      >
        <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg"
          >
            <span className="text-white text-sm font-bold">
              {user?.email.charAt(0).toUpperCase() || "U"}
            </span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate" data-testid="text-user-email">
              {user?.email || "Unknown User"}
            </p>
            <p className="text-white/70 text-xs capitalize" data-testid="text-user-role">
              {user?.role.toLowerCase() || "Unknown Role"}
            </p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-xl backdrop-blur-sm"
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </motion.div>
      </motion.div>
    </motion.aside>
  );
}
