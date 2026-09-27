import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root },
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
  serverExternalPackages: ["obj2gltf", "adm-zip"],
  async headers() {
    return [
      {
        source: "/:path*.usdz",
        headers: [{ key: "Content-Type", value: "model/vnd.usdz+zip" }],
      },
      {
        source: "/:path*.glb",
        headers: [{ key: "Content-Type", value: "model/gltf-binary" }],
      },
    ];
  },
};

export default nextConfig;
