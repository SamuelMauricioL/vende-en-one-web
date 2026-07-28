import { clerkMiddleware } from "@clerk/astro/server";

const protectedPaths = ["/app"];

export const onRequest = clerkMiddleware((auth, context, next) => {
  const url = new URL(context.request.url);
  const isProtected = protectedPaths.some((path) =>
    url.pathname === path || url.pathname.startsWith(path + "/")
  );

  if (isProtected) {
    const { userId } = auth();
    if (!userId) {
      return context.redirect("/sign-in");
    }
  }
  return next();
});
