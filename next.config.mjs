/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // avatares e capas vêm do Supabase Storage; vídeo vem do Bunny (iframe)
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.b-cdn.net" },
    ],
  },
};

export default nextConfig;
