// Zorbas Service Worker

self.addEventListener("install", () => {
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  // Take control of all open tabs right away
  event.waitUntil(clients.claim());
});

// Receive messages from the page
self.addEventListener("message", event => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || "Zorbas", {
        body: body || "",
        icon: "https://www.zorbas.com.cy/wp-content/uploads/cropped-zorbas-favicon-01-270x270.png",
        badge: "https://www.zorbas.com.cy/wp-content/uploads/cropped-zorbas-favicon-01-270x270.png",
        tag: tag || "zorbas",
        renotify: true,
        vibrate: [200, 100, 200]
      })
    );
  }
});

// Real web push from the server — works when the app/browser is closed
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: "Zorbas", body: event.data ? event.data.text() : "" }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "Zorbas", {
      body: data.body || "",
      icon: "https://www.zorbas.com.cy/wp-content/uploads/cropped-zorbas-favicon-01-270x270.png",
      badge: "https://www.zorbas.com.cy/wp-content/uploads/cropped-zorbas-favicon-01-270x270.png",
      tag: data.tag || "zorbas",
      renotify: true,
      vibrate: [200, 100, 200],
      data: { targetUrl: data.targetUrl || data.url || "/", url: data.targetUrl || data.url || "/" }
    })
  );
});

// Clicking the notification opens the app at the right URL
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const raw = event.notification.data?.targetUrl || event.notification.data?.url || "/";
  // Always resolve to an absolute URL so Android doesn't open a browser search
  const targetUrl = raw.startsWith("http") ? raw : (self.location.origin + (raw.startsWith("/") ? raw : "/" + raw));
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      // If app is already open, navigate it to the target URL and focus
      for (const client of list) {
        const clientUrl = new URL(client.url);
        const targetParsed = new URL(targetUrl);
        if (clientUrl.origin === targetParsed.origin) {
          return client.navigate(targetUrl).then(c => c && c.focus ? c.focus() : null);
        }
      }
      // App not open — open it at the target URL
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
