// Cor consistente por cliente, sem precisar de um campo novo no banco —
// deriva um matiz (hue) do próprio id, sempre o mesmo para o mesmo cliente.
export function clientColor(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash << 5) - hash + clientId.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}
