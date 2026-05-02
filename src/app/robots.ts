import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/partner/', '/account/', '/api/'],
    },
    sitemap: 'https://gymdate.in/sitemap.xml',
  }
}
