"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateInvoicePaidDate } from "@/app/actions/invoice-history";

export function EditPaidDateButton({ id, currentDate }: { id: string; currentDate: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700" title="Corrigir data">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Corrigir Data do Recebimento</DialogTitle>
        </DialogHeader>
        <form action={updateInvoicePaidDate} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <label className="text-xs text-gray-500 space-y-1 block">
            Data em que foi recebido
            <Input name="paidAt" type="date" defaultValue={currentDate} required />
          </label>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
