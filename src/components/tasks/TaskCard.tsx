"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateTaskDetails, moveTask, approveTask, rejectTask, deleteTask } from "@/app/actions/tasks";
import { taskTypeLabel } from "@/lib/tasks";
import { formatDate, getInitials } from "@/lib/utils";
import type { Task, TaskStatus, TaskType } from "@prisma/client";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const typeBadgeVariant: Record<TaskType, "info" | "purple" | "warning" | "gray"> = {
  POST: "info",
  STORY: "purple",
  BLOG: "warning",
  SITE_UPDATE: "gray",
  OTHER: "gray",
};

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

type TaskWithRelations = Task & {
  client: { id: string; name: string; company: string | null };
  assignee: { id: string; name: string | null; email: string } | null;
};

export function TaskCard({
  task,
  users,
  canApprove,
}: {
  task: TaskWithRelations;
  users: UserOption[];
  canApprove: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  function runAction(action: (formData: FormData) => Promise<void>, formData: FormData, closeOnSuccess = true) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
        if (closeOnSuccess) setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao processar a tarefa.");
      }
    });
  }

  function handleMove(status: TaskStatus) {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("status", status);
    runAction(moveTask, fd);
  }

  function handleApprove() {
    const fd = new FormData();
    fd.set("id", task.id);
    runAction(approveTask, fd);
  }

  function handleReject(note: string) {
    const fd = new FormData();
    fd.set("id", task.id);
    fd.set("reviewNote", note);
    runAction(rejectTask, fd);
  }

  function handleDelete() {
    if (!confirm("Excluir esta tarefa? Essa ação não pode ser desfeita.")) return;
    const fd = new FormData();
    fd.set("id", task.id);
    runAction(deleteTask, fd);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-colors space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={typeBadgeVariant[task.type]}>{taskTypeLabel[task.type]}</Badge>
            {task.dueDate && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{task.title}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.client.company || task.client.name}</span>
            {task.assignee && (
              <span
                title={task.assignee.name || task.assignee.email}
                className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              >
                {getInitials(task.assignee.name || task.assignee.email)}
              </span>
            )}
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {task.client.company || task.client.name}
            {task.reviewNote && task.status === "REJECTED" && (
              <span className="block mt-1 text-red-500 dark:text-red-400">Motivo da reprovação: {task.reviewNote}</span>
            )}
          </p>

          {task.status === "REVIEW" && canApprove && (
            <div className="space-y-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Aguardando sua aprovação</p>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" disabled={isPending} onClick={handleApprove}>
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Aprovar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900"
                  disabled={isPending}
                  onClick={() => setRejecting((v) => !v)}
                >
                  <X className="h-3.5 w-3.5" />
                  Reprovar
                </Button>
              </div>
              {rejecting && (
                <div className="flex items-center gap-2 pt-1">
                  <Input id={`reject-note-${task.id}`} placeholder="Motivo (opcional)" className="h-8 text-xs" />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    disabled={isPending}
                    onClick={() => {
                      const el = document.getElementById(`reject-note-${task.id}`) as HTMLInputElement | null;
                      handleReject(el?.value || "");
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              )}
            </div>
          )}

          {(task.status === "TODO" || task.status === "IN_PROGRESS" || task.status === "REVIEW") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 dark:text-gray-500">Mover para:</span>
              {task.status !== "TODO" && (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" disabled={isPending} onClick={() => handleMove("TODO")}>
                  A Fazer
                </Button>
              )}
              {task.status !== "IN_PROGRESS" && (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" disabled={isPending} onClick={() => handleMove("IN_PROGRESS")}>
                  Em Produção
                </Button>
              )}
              {task.status !== "REVIEW" && (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs" disabled={isPending} onClick={() => handleMove("REVIEW")}>
                  Enviar para Aprovação
                </Button>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>

        <form action={updateTaskDetails} onSubmit={() => setOpen(false)} className="space-y-3 pt-3 border-t">
          <input type="hidden" name="id" value={task.id} />
          <Input name="title" defaultValue={task.title} required />
          <select name="type" defaultValue={task.type} className={inputClass}>
            {Object.entries(taskTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            name="description"
            defaultValue={task.description ?? ""}
            placeholder="Descrição / briefing"
            rows={3}
            className={inputClass.replace("h-10", "") + " min-h-[4rem]"}
          />
          <Input name="contentUrl" defaultValue={task.contentUrl ?? ""} placeholder="Link de referência / arquivo" />
          <div className="grid grid-cols-2 gap-3">
            <select name="assigneeId" defaultValue={task.assignee?.id ?? ""} className={inputClass}>
              <option value="">Sem responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
            <Input name="dueDate" type="date" defaultValue={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""} />
          </div>
          <select name="priority" defaultValue={task.priority} className={inputClass}>
            <option value="LOW">Prioridade baixa</option>
            <option value="MEDIUM">Prioridade média</option>
            <option value="HIGH">Prioridade alta</option>
            <option value="URGENT">Urgente</option>
          </select>
          <div className="flex items-center gap-2">
            <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
              Salvar Alterações
            </Button>
            <Button type="button" variant="outline" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" disabled={isPending} onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
