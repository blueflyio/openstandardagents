interface StructuredDataProps {
  type: 'Organization' | 'WebSite' | 'Article';
  data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const baseUrl = 'https://openstandardagents.org';

  const getStructuredData = (): object => {
    switch (type) {
      case 'Organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'OSSA Standards Team',
          url: baseUrl,
          logo: `${baseUrl}/assets/brand/ossa-logo.svg`,
          sameAs: [
            'https://github.com/blueflyio/openstandardagents',
            'https://www.npmjs.com/package/@bluefly/open-standards-scalable-agents',
          ],
          ...data,
        };
      case 'WebSite':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'OSSA',
          url: baseUrl,
          description: 'Open Standard for Scalable AI Agents - The OpenAPI for AI Agents',
          ...data,
        };
      case 'Article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: data.title,
          datePublished: data.date,
          author: {
            '@type': 'Person',
            name: data.author || 'OSSA Team',
          },
          publisher: {
            '@type': 'Organization',
            name: 'OSSA Standards Team',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`,
            },
          },
          ...data,
        };
      default:
        return {};
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getStructuredData()) }}
    />
  );
}

