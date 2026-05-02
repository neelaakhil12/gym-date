import { MetadataRoute } from 'next'
import { getGyms } from '@/actions/publicActions'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gymdate.in';

  // Base routes
  const routes = [
    '',
    '/explore',
    '/pricing',
    '/about',
    '/contact',
    '/faq',
    '/partner',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Gym routes
  let gymRoutes: MetadataRoute.Sitemap = [];
  try {
    const gyms = await getGyms();
    gymRoutes = gyms.map((gym: any) => ({
      url: `${baseUrl}/gym/${gym.id}`,
      lastModified: new Date(gym.updated_at || gym.created_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch (err) {
    console.error("Failed to fetch gyms for sitemap:", err);
  }

  return [...routes, ...gymRoutes];
}
