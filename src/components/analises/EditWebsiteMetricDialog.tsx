"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logWebsiteMetric } from "@/app/actions/website";

interface WebsiteMetricData {
  clientId: string;
  clientName: string;
  month: string;
  pageViews: number | null;
  totalUsers: number | null;
  newUsers: number | null;
}

export function EditWebsiteMetricDialog({ metric }: { metric: WebsiteMetricData }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Métrica do Site — {metric.clientName}</DialogTitle>
        </DialogHeader>
        <form action={logWebsiteMetric} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="clientId" value={metric.clientId} />
          <Input name="month" type="month" defaultValue={metric.month} required />
          <Input name="pageViews" type="number" defaultValue={metric.pageViews ?? ""} placeholder="Visualizações" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="totalUsers" type="number" defaultValue={metric.totalUsers ?? ""} placeholder="Total de usuários" />
            <Input name="newUsers" type="number" defaultValue={metric.newUsers ?? ""} placeholder="Novos usuários" />
          </div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
