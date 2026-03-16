'use client'

import { Bell, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { signOut } from "@/lib/actions/authActions";

export default function TeamMembersHeader() {
    return (
        <header className="bg-white border-b border-border px-6 py-3 sticky top-0 z-10 flex justify-between items-center shadow-sm">
        <div className="font-bold text-lg tracking-tight text-primary">
          Rendy <span className="text-muted-foreground font-normal">Staff</span>
        </div>
        {/* You could put a notification bell here later */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button onClick={()=>signOut()} variant="ghost">
            Sign Out
          </Button>
        </div>
      </header>
    );
}
