"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clientReviewPart, clientGeneralComment } from "@/app/actions/task-approval";
import { taskHasCaption, taskTypeLabel } from "@/lib/tasks";
import { approvalStatusLabel } from "@/lib/task-approval";
import type { ApprovalStatus, CommentPart, CommentRole, MediaKind, TaskStatus, TaskType } from "@prisma/client";

interface MediaEntry {
  id: string;
  url: string;
  kind: MediaKind;
}

interface CommentEntry {
  id: string;
  author: string;
  role: CommentRole;
  part: CommentPart;
  kind: string;
  text: string;
  createdAt: Date;
}

interface TaskEntry {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  caption: string | null;
  artStatus: ApprovalStatus;
  captionStatus: ApprovalStatus;
  media: MediaEntry[];
  comments: CommentEntry[];
}

const statusBadgeVariant: Record<ApprovalStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "danger",
};

const taskStatusText: Record<TaskStatus, string> = {
  TODO: "",
  IN_PROGRESS: "",
  REVIEW: "Aguardando sua aprovação",
  APPROVED: "Aprovado — agendamento com a agência",
  REJECTED: "Ajuste pedido",
  POSTED: "Publicado",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

const commentKindText: Record<string, string> = {
  APPROVED: "aprovou",
  CHANGES_REQUESTED: "pediu ajuste",
  COMMENT: "comentou",
  VERSION: "enviou uma nova versão",
};

const commentPartText: Record<CommentPart, string> = { ART: "arte", CAPTION: "legenda", GENERAL: "" };

function CommentThread({ comments }: { comments: CommentEntry[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {comments.map((c) => (
        <div key={c.id} className="text-xs bg-gray-50 dark:bg-gray-800 rounded-md px-2.5 py-1.5">
          <p className="text-gray-500 dark:text-gray-400">
            <span className={c.role === "CLIENT" ? "font-medium text-blue-600 dark:text-blue-400" : "font-medium text-orange-600 dark:text-orange-400"}>
              {c.author}
            </span>{" "}
            {commentKindText[c.kind] || "comentou"}
            {commentPartText[c.part] ? ` (${commentPartText[c.part]})` : ""} · {formatDateTime(c.createdAt)}
          </p>
          {c.text && <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line mt-0.5">{c.text}</p>}
        </div>
      ))}
    </div>
  );
}

function MediaGallery({ media }: { media: MediaEntry[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {media.map((m) => (
        <div key={m.id} className="h-28 w-28 rounded-md overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 shrink-0">
          {m.kind === "VIDEO" ? (
            <video src={m.url} className="h-full w-full object-cover" controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}

function ApprovalPartControl({
  token,
  taskId,
  part,
  status,
  label,
  author,
}: {
  token: string;
  taskId: string;
  part: "ART" | "CAPTION";
  status: ApprovalStatus;
  label: string;
  author: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [askingChanges, setAskingChanges] = useState(false);
  const [changeText, setChangeText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send(decision: "APPROVED" | "CHANGES_REQUESTED", text: string) {
    if (!author.trim()) {
      setError("Informe seu nome no topo da página antes de aprovar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("token", token);
        fd.set("taskId", taskId);
        fd.set("part", part);
        fd.set("decision", decision);
        fd.set("author", author.trim());
        fd.set("text", text);
        await clientReviewPart(fd);
        setAskingChanges(false);
        setChangeText("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar.");
      }
    });
  }

  if (status !== "PENDING") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}:</span>
        <Badge variant={statusBadgeVariant[status]}>{approvalStatusLabel[status]}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16">{label}:</span>
        <Button type="button" size="sm" className="h-7 gap-1 bg-green-600 hover:bg-green-700 text-xs" disabled={isPending} onClick={() => send("APPROVED", "")}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Aprovar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900"
          disabled={isPending}
          onClick={() => setAskingChanges((v) => !v)}
        >
          <X className="h-3 w-3" />
          Pedir ajuste
        </Button>
      </div>
      {askingChanges && (
        <div className="flex items-start gap-2 pl-[4.5rem]">
          <textarea
            value={changeText}
            onChange={(e) => setChangeText(e.target.value)}
            placeholder="O que precisa mudar?"
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="button" size="sm" variant="outline" className="h-8 text-xs shrink-0" disabled={isPending || !changeText.trim()} onClick={() => send("CHANGES_REQUESTED", changeText.trim())}>
            Enviar
          </Button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 dark:text-red-400 pl-[4.5rem]">{error}</p>}
    </div>
  );
}

function GeneralCommentBox({ token, taskId, author }: { token: string; taskId: string; author: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSend() {
    if (!author.trim()) {
      setError("Informe seu nome no topo da página antes de comentar.");
      return;
    }
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("token", token);
        fd.set("taskId", taskId);
        fd.set("author", author.trim());
        fd.set("text", text.trim());
        await clientGeneralComment(fd);
        setText("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao comentar.");
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Deixar um comentário..."
          rows={2}
          className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 gap-1 text-xs" disabled={isPending || !text.trim()} onClick={handleSend}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageCircle className="h-3.5 w-3.5" />}
          Comentar
        </Button>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function TaskPieceCard({ token, task, author }: { token: string; task: TaskEntry; author: string }) {
  const needsCaption = taskHasCaption(task.type);
  const isPending = task.status === "REVIEW";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.title}</CardTitle>
          <Badge variant="info">{taskTypeLabel[task.type]}</Badge>
        </div>
        {taskStatusText[task.status] && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{taskStatusText[task.status]}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <MediaGallery media={task.media} />

        {isPending ? (
          <ApprovalPartControl token={token} taskId={task.id} part="ART" status={task.artStatus} label="Arte" author={author} />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Arte:</span>
            <Badge variant={statusBadgeVariant[task.artStatus]}>{approvalStatusLabel[task.artStatus]}</Badge>
          </div>
        )}

        {needsCaption && task.caption && (
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line bg-gray-50 dark:bg-gray-800 rounded-md p-2.5">{task.caption}</p>
        )}

        {needsCaption &&
          (isPending ? (
            <ApprovalPartControl token={token} taskId={task.id} part="CAPTION" status={task.captionStatus} label="Legenda" author={author} />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Legenda:</span>
              <Badge variant={statusBadgeVariant[task.captionStatus]}>{approvalStatusLabel[task.captionStatus]}</Badge>
            </div>
          ))}

        <CommentThread comments={task.comments} />
        <GeneralCommentBox token={token} taskId={task.id} author={author} />
      </CardContent>
    </Card>
  );
}

export function ClientApprovalBoard({
  token,
  clientName,
  tasks,
}: {
  token: string;
  clientName: string;
  tasks: TaskEntry[];
}) {
  const [author, setAuthor] = useState("");
  const pending = tasks.filter((t) => t.status === "REVIEW");
  const history = tasks.filter((t) => t.status !== "REVIEW");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{clientName}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Aprovação de conteúdo</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">Seu nome (pra identificar quem aprovou/comentou)</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Seu nome"
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {tasks.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Nenhum conteúdo pra aprovar por aqui ainda.</p>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Aguardando sua aprovação</h2>
            {pending.map((t) => (
              <TaskPieceCard key={t.id} token={token} task={t} author={author} />
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Histórico</h2>
            {history.map((t) => (
              <TaskPieceCard key={t.id} token={token} task={t} author={author} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
