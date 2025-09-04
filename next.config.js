/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
    domains: ['lh3.googleusercontent.com', 'supabase.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix complet pour l'erreur undici avec les champs privés
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "undici": false,
        "fs": false,
        "net": false,
        "tls": false,
        "crypto": false,
        "stream": false,
        "util": false,
        "buffer": false,
        "events": false,
      };
      
      // Exclure undici du bundle client
      config.externals = config.externals || [];
      config.externals.push('undici');
    }
    
    // Gérer les champs privés JavaScript
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/undici/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', { targets: 'defaults' }]],
          plugins: [
            ['@babel/plugin-proposal-private-methods', { loose: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
          ]
        }
      }
    });
    
    return config;
  },
  transpilePackages: ['@google/generative-ai'],
  swcMinify: false, // Désactiver SWC qui peut causer des problèmes avec les champs privés
}

module.exports = nextConfig
