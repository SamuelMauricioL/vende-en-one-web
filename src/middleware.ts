import { clerkMiddleware } from "@clerk/astro/server";

const clerk = clerkMiddleware();

export const onRequest = clerk;
