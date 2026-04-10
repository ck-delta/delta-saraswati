export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Delta Saraswati',
    url: 'https://delta-saraswati.vercel.app',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'AI-powered crypto perpetuals research dashboard with real-time market data, technical analysis, and intelligent trading insights.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'Delta Saraswati',
      url: 'https://delta-saraswati.vercel.app',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
