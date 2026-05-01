import path from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
