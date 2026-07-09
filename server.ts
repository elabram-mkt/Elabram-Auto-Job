import express from "express";
import path from "path";
import dns from "dns";
import app from "./api/index.js";

const PORT = 3000;

// Force Node.js to prefer IPv4 when resolving DNS. 
// This resolves the common 'fetch failed' (TypeError) issue with global fetch inside virtualized container environments.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (error) {
  console.warn("Could not set DNS default result order:", error);
}

const startLocalServer = async () => {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startLocalServer();

export default app;
