import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { UploadPostForm } from "@/components/projetos/UploadPostForm";
import { DeletePostButton } from "@/components/projetos/DeletePostButton";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currentMonth = new Date().toISOString().slice(0, 7);

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: { cliente?: string; mes?: string };
}) {
  const selectedClientId = searchParams.cliente || "";
  const selectedMonth = searchParams.mes || currentMonth;

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });

  const monthDate = new Date(`${selectedMonth}-01T00:00:00.000Z`);

  const posts = await prisma.clientPost.findMany({
    where: {
      month: monthDate,
      ...(selectedClientId ? { clientId: selectedClientId } : {}),
    },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header title="Projetos" subtitle="Posts realizados por cliente, mês a mês, para gerar relatórios" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form className="flex items-center gap-2" method="get">
            <select
              name="cliente"
              defaultValue={selectedClientId}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company || c.name}
                </option>
              ))}
            </select>
            <input
              type="month"
              name="mes"
              defaultValue={selectedMonth}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
            />
            <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
              Filtrar
            </button>
          </form>
          <UploadPostForm clients={clients} defaultClientId={selectedClientId} />
        </div>

        {clients.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500">
              Cadastre um cliente primeiro para poder enviar posts.
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500">
              Nenhum post enviado para {selectedMonth.split("-").reverse().join("/")}
              {selectedClientId ? " para este cliente" : ""}. Clique em &quot;Enviar Post&quot; para adicionar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-0 shadow-sm overflow-hidden">
                <div className="relative aspect-square bg-gray-100">
                  <Image src={post.imageUrl} alt={post.caption || "Post"} fill className="object-cover" unoptimized />
                  <DeletePostButton postId={post.id} />
                </div>
                <CardContent className="p-3 space-y-1">
                  <Link href={`/clientes/${post.client.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                    {post.client.company || post.client.name}
                  </Link>
                  {post.caption && <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>}
                  <p className="text-[11px] text-gray-400">
                    {post.postDate ? formatDate(post.postDate) : formatDate(post.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
