import withAuth from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/projetos/:path*",
    "/financeiro/:path*",
    "/metricas/:path*",
    "/contratos/:path*",
    "/configuracoes/:path*",
  ],
};
