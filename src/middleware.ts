import withAuth from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // /aprovacao fica fora do login: é o link público (com token) que o
    // cliente usa pra aprovar conteúdo, sem conta no sistema.
    "/((?!api|_next/static|_next/image|favicon.ico|login|esqueci-senha|redefinir-senha|manifest.webmanifest|sw.js|icons|aprovacao).*)",
  ],
};
