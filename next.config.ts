import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // football-data.org serves crest images from crests.football-data.org
    remotePatterns: [
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
