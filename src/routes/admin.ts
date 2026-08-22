import { createFileRoute } from "@tanstack/react-router";
import html from "../pages-html/admin.html?raw";

const adminResponse = () =>
  new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  });

export const Route = createFileRoute("/admin")(({
  server: {
    handlers: {
      GET: adminResponse,
    },
  },
} as Parameters<ReturnType<typeof createFileRoute>>[0]));
