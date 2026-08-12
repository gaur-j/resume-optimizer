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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  onSignOut?: () => void;
};

// data-popup-open is Base UI's own convention for "this trigger's popup is
// currently open" — confirmed against DropdownMenuSubTrigger's styling in
// components/ui/dropdown-menu.tsx, not guessed.
const triggerClass = cn(
  "flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-2",
  "transition-colors duration-200 ease-out motion-reduce:transition-none",
  "hover:bg-accent/70 hover:border-border/60",
  "data-popup-open:bg-accent/70 data-popup-open:border-border/60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

export function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  const { collapsed } = useSidebar();
  const { theme, setTheme } = useTheme();

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const triggerButton = (
    <DropdownMenuTrigger
      className={cn(triggerClass, collapsed && "justify-center px-0")}
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
  );

  return (
    <DropdownMenu>
      {/* Collapsed rail: wrap the trigger in a tooltip via the `render`
          prop (Base UI's composition pattern) so it merges onto the SAME
          button as the dropdown trigger, instead of nesting two separate
          interactive elements. */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger render={triggerButton} />
          <TooltipContent side="right" sideOffset={12} className="font-medium">
            {user.name}
          </TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}

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
          <DropdownMenuItem disabled>
            <Settings className="h-4 w-4" />
            Account Settings
            <span className="ml-auto text-[10px] text-muted-foreground">
              Soon
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <ShieldCheck className="h-4 w-4" />
            Password &amp; Security
            <span className="ml-auto text-[10px] text-muted-foreground">
              Soon
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <History className="h-4 w-4" />
            History
            <span className="ml-auto text-[10px] text-muted-foreground">
              Soon
            </span>
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

        <DropdownMenuItem disabled>
          <Lock className="h-4 w-4" />
          Privacy
          <span className="ml-auto text-[10px] text-muted-foreground">
            Soon
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <MessageCircleQuestion className="h-4 w-4" />
          Feedback &amp; Help
          <span className="ml-auto text-[10px] text-muted-foreground">
            Soon
          </span>
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
