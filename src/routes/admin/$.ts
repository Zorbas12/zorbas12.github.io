import { createFileRoute } from "@tanstack/react-router";
import html from "../../pages-html/admin.html?raw";

export const Route = createFileRoute("/admin/$")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-cache",
          },
        }),
    },
  },
});
