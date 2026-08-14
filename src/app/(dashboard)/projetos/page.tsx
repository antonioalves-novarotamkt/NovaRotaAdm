import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, Share2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { UploadPostForm } from "@/components/projetos/UploadPostForm";
import { DeletePostButton } from "@/components/projetos/DeletePostButton";
import { EditPostMetrics } from "@/components/projetos/EditPostMetrics";
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
      <Header title="Posts" subtitle="Prints dos posts publicados, mês a mês — use o botão do gráfico para registrar visualizações, curtidas e compartilhamentos" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form className="flex items-center gap-2" method="get">
            <select
              name="cliente"
              defaultValue={selectedClientId}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
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
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
            />
            <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Filtrar
            </button>
          </form>
          <UploadPostForm clients={clients} defaultClientId={selectedClientId} />
        </div>

        {clients.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Cadastre um cliente primeiro para poder enviar posts.
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Nenhum post enviado para {selectedMonth.split("-").reverse().join("/")}
              {selectedClientId ? " para este cliente" : ""}. Clique em &quot;Enviar Post&quot; para adicionar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-0 shadow-sm overflow-hidden">
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  <Image src={post.imageUrl} alt={post.caption || "Post"} fill className="object-cover" unoptimized />
                  <EditPostMetrics
                    postId={post.id}
                    instagramViews={post.instagramViews}
                    instagramLikes={post.instagramLikes}
                    instagramShares={post.instagramShares}
                    facebookViews={post.facebookViews}
                    facebookLikes={post.facebookLikes}
                    facebookShares={post.facebookShares}
                  />
                  <DeletePostButton postId={post.id} />
                </div>
                <CardContent className="p-3 space-y-1">
                  <Link href={`/clientes/${post.client.id}`} className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline">
                    {post.client.company || post.client.name}
                  </Link>
                  {post.caption && <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{post.caption}</p>}
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {post.postDate ? formatDate(post.postDate) : formatDate(post.createdAt)}
                  </p>
                  {(() => {
                    const hasMetrics =
                      post.instagramViews != null ||
                      post.instagramLikes != null ||
                      post.instagramShares != null ||
                      post.facebookViews != null ||
                      post.facebookLikes != null ||
                      post.facebookShares != null;
                    if (!hasMetrics) return null;
                    const totalViews = (post.instagramViews ?? 0) + (post.facebookViews ?? 0);
                    const totalLikes = (post.instagramLikes ?? 0) + (post.facebookLikes ?? 0);
                    const totalShares = (post.instagramShares ?? 0) + (post.facebookShares ?? 0);
                    return (
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {totalViews.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" /> {totalLikes.toLocaleString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" /> {totalShares.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
