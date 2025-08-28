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
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div
        className={cn(
          "flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors duration-200 cursor-pointer",
          isActive && "text-white bg-primary"
        )}
        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="w-5 h-5 mr-3">{icon}</div>
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
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
    <aside className="w-64 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <University className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">UniRes</h2>
            <p className="text-slate-400 text-sm">Reception Desk</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.email.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate" data-testid="text-user-email">
              {user?.email || "Unknown User"}
            </p>
            <p className="text-slate-400 text-xs capitalize" data-testid="text-user-role">
              {user?.role.toLowerCase() || "Unknown Role"}
            </p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
