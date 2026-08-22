import { createFileRoute } from "@tanstack/react-router";
import html from "../../pages-html/history.html?raw";

export const Route = createFileRoute("/history/$")({
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
