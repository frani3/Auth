/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para evitar problemas con el SDK de Google en el cliente
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;
