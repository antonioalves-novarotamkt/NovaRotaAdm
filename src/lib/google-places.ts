export interface PlaceResult {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  ratingCount: number | null;
}

export async function searchPlaces(category: string, city: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY não configurada. Adicione a chave da Google Places API nas variáveis de ambiente."
    );
  }

  const textQuery = `${category} em ${city}`;

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({ textQuery, languageCode: "pt-BR", maxResultCount: 20 }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erro na busca do Google Places (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const places: unknown[] = data.places || [];

  return places.map((p) => {
    const place = p as {
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      nationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
    };
    return {
      id: place.id,
      name: place.displayName?.text || "Sem nome",
      address: place.formattedAddress || null,
      phone: place.nationalPhoneNumber || null,
      website: place.websiteUri || null,
      rating: place.rating ?? null,
      ratingCount: place.userRatingCount ?? null,
    };
  });
}
