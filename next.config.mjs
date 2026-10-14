/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Link de aprovação do cliente leva um token na própria URL — sem
        // Referrer-Policy restrita, esse token vazaria pra qualquer recurso
        // de terceiro carregado na página (ex: fontes do Google) via header
        // Referer. X-Frame-Options evita embutir a página num iframe de
        // outro site.
        source: "/aprovacao/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
