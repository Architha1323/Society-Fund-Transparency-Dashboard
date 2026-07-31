import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/dashboard", label: "Go to Dashboard", icon: LayoutDashboard },
  { to: "/income", label: "View Income", icon: ArrowDownCircle },
  { to: "/expenses", label: "View Expenses", icon: ArrowUpCircle },
  { to: "/residents", label: "View Residents", icon: Users },
  { to: "/reports", label: "Generate Reports", icon: FileBarChart },
  { to: "/settings", label: "Open Settings", icon: Settings },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search dashboards, residents, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map(({ to, label, icon: Icon }) => (
            <CommandItem
              key={to}
              onSelect={() => {
                navigate({ to });
                onOpenChange(false);
              }}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Account">
          <CommandItem
            onSelect={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
              onOpenChange(false);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
