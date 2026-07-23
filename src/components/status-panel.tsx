"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { StatusState } from "./live-controller";

const kindConfig: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; color: string }> = {
  ok: { variant: "default", color: "bg-emerald-500 text-emerald-950 hover:bg-emerald-500" },
  err: { variant: "destructive", color: "bg-red-400 text-red-950 hover:bg-red-400" },
  warn: { variant: "secondary", color: "bg-amber-400 text-amber-950 hover:bg-amber-400" },
  "": { variant: "outline", color: "bg-muted text-muted-foreground hover:bg-muted" },
};

export function StatusPanel({ status }: { status: StatusState }) {
  const config = kindConfig[status.kind] || kindConfig[""];
  const isLoading = status.text.includes("…");

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
          Estado de la última acción
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-background/30 p-4 font-mono text-sm min-h-[56px]">
          <Badge className={`mt-0.5 h-3 w-3 p-0 rounded-full ${config.color}`} />
          <span className="break-all text-muted-foreground leading-relaxed">
            {isLoading && <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-2" />}
            {status.text}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
