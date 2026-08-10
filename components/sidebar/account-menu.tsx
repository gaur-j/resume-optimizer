"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "./sidebar-provider";
import { cn } from "@/lib/utils";
import {
  Settings,
  ShieldCheck,
  History,
  Palette,
  Lock,
  MessageCircleQuestion,
  LogOut,
  Sun,
  Moon,
  Monitor,
  ChevronsUpDown,
} from "lucide-react";

type AccountUser = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type AccountMenuProps = {
  user: AccountUser;
  onNavigate?: (destination: string) => void;
  onSignOut?: () => void;
};

export function AccountMenu({ user, onNavigate, onSignOut }: AccountMenuProps) {
  const { collapsed } = useSidebar();
  const { theme, setTheme } = useTheme();

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-2"
      >
        <Avatar className="h-8 w-8 shrink-0 border border-border/60">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        {!collapsed && (
          <>
            <span className="flex min-w-0 flex-1 flex-col items-start text-left">
              <span className="w-full truncate text-sm font-medium leading-tight">
                {user.name}
              </span>
              <span className="w-full truncate text-xs leading-tight text-muted-foreground">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align="start"
        sideOffset={8}
        className="w-64"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="flex flex-col">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onNavigate?.("account-settings")}>
            <Settings className="h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNavigate?.("password-security")}>
            <ShieldCheck className="h-4 w-4" />
            Password &amp; Security
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNavigate?.("history")}>
            <History className="h-4 w-4" />
            History
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="h-4 w-4" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={() => onNavigate?.("privacy")}>
          <Lock className="h-4 w-4" />
          Privacy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate?.("feedback")}>
          <MessageCircleQuestion className="h-4 w-4" />
          Feedback &amp; Help
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
