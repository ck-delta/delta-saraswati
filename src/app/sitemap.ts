import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://delta-saraswati.vercel.app', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://delta-saraswati.vercel.app/research', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://delta-saraswati.vercel.app/chat', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];
}
