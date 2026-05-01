import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          "vendor-router": ["react-router-dom"],
          "chunk-landing": [
            "./src/components/verimat/Navbar",
            "./src/components/verimat/Hero",
            "./src/components/verimat/ScanningSection",
            "./src/components/verimat/ProblemSection",
            "./src/components/verimat/HowItWorks",
            "./src/components/verimat/Features",
            "./src/components/verimat/Technology",
            "./src/components/verimat/CTASection",
            "./src/components/verimat/Footer",
          ],
          "chunk-app": [
            "./src/pages/app/Dashboard",
            "./src/pages/app/AuditTrail",
            "./src/pages/app/VerificationResult",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
