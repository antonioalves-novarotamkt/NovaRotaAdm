const API_BASE = "https://api.aisa.one/apis/v1";

// A resposta da AIsa embrulha o post/perfil em chaves que variam (ex: dentro
// de data.user, ou de um node de timeline) — em vez de fixar um caminho, isso
// procura em qualquer nivel do objeto pelo primeiro node que tenha os campos
// esperados, o mesmo jeito que o Instagram usa internamente pra descrever um post.
function findNode(obj: unknown, keys: string[], depth = 0): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object" || depth > 8) return null;
  const record = obj as Record<string, unknown>;
  if (keys.some((k) => k in record)) return record;
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const found = findNode(value, keys, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export interface InstagramPostMetrics {
  likes: number | null;
  comments: number | null;
  views: number | null;
}

export async function fetchInstagramPostMetrics(postUrl: string, apiKey: string): Promise<InstagramPostMetrics> {
  const response = await fetch(`${API_BASE}/instagram/post?url=${encodeURIComponent(postUrl)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Erro HTTP ${response.status} ao buscar o post na AIsa. Detalhe: ${detail.slice(0, 300)}.`
    );
  }

  const data = await response.json();
  const node = findNode(data, ["edge_media_preview_like", "edge_media_to_comment", "like_count"]);
  if (!node) {
    throw new Error(
      "Não foi possível localizar os dados desse post na resposta da AIsa. Confira se o link está correto e o perfil é público."
    );
  }

  const likesRaw = (node.edge_media_preview_like as { count?: number } | undefined)?.count ?? node.like_count;
  const commentsRaw = (node.edge_media_to_comment as { count?: number } | undefined)?.count ?? node.comment_count;

  return {
    likes: typeof likesRaw === "number" ? likesRaw : null,
    comments: typeof commentsRaw === "number" ? commentsRaw : null,
    views: typeof node.video_view_count === "number" ? node.video_view_count : null,
  };
}

export async function fetchInstagramFollowerCount(handle: string, apiKey: string): Promise<number> {
  const response = await fetch(`${API_BASE}/instagram/profile?handle=${encodeURIComponent(handle)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Erro HTTP ${response.status} ao buscar o perfil na AIsa. Detalhe: ${detail.slice(0, 300)}.`
    );
  }

  const data = await response.json();
  const follower = data?.data?.user?.follower_count ?? data?.user?.follower_count;
  if (typeof follower !== "number") {
    throw new Error(
      data?.message ||
        "Não foi possível obter o número de seguidores. Confira se o @ está correto e o perfil é público."
    );
  }
  return follower;
}
