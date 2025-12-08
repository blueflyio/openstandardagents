'use client';

interface LogoProps {
  domain: string;
  name: string;
}

// Special handling for domains that don't work with clearbit
// Use SimpleIcons or direct logo URLs where available
const LOGO_FALLBACKS: Record<string, string> = {
  'kagent.dev': 'https://www.google.com/s2/favicons?sz=256&domain=kagent.dev',
  'langchain.com': 'https://cdn.simpleicons.org/langchain',
  'crewai.com': 'https://www.google.com/s2/favicons?sz=128&domain=crewai.com',
  'llamaindex.ai': 'https://www.google.com/s2/favicons?sz=128&domain=llamaindex.ai',
  'modelcontextprotocol.io': 'https://cdn.simpleicons.org/anthropic',
  'librechat.com': 'https://cdn.simpleicons.org/react',
  'langflow.com': 'https://avatars.githubusercontent.com/u/85702467?s=200&v=4',
  'openai.com': 'https://cdn.simpleicons.org/openai',
  'anthropic.com': 'https://cdn.simpleicons.org/anthropic',
  'cursor.sh': 'https://cursor.com/apple-touch-icon.png',
  'microsoft.com': 'https://www.google.com/s2/favicons?sz=256&domain=microsoft.com',
  'vercel.com': 'https://cdn.simpleicons.org/vercel',
  'drupal.org': 'https://cdn.simpleicons.org/drupal',
  'huggingface.co': 'https://cdn.simpleicons.org/huggingface',
  'google.com': 'https://cdn.simpleicons.org/google',
  'deepmind.google': 'https://www.google.com/s2/favicons?sz=256&domain=deepmind.google',
  'aws.amazon.com': 'https://www.google.com/s2/favicons?sz=128&domain=aws.amazon.com',
  'azure.com': 'https://cdn.simpleicons.org/microsoftazure',
  'github.com': 'https://cdn.simpleicons.org/github',
  'docker.com': 'https://cdn.simpleicons.org/docker',
  'kubernetes.io': 'https://cdn.simpleicons.org/kubernetes',
};

export function Logo({ domain, name }: LogoProps) {
  const getLogoSrc = () => {
    // Check for name-based fallbacks first (for cases where domain is shared)
    if (name === 'LangGraph' && domain === 'langchain.com') {
      return 'https://cdn.simpleicons.org/langchain';
    }
    if (name === 'LlamaIndex') {
      return 'https://www.google.com/s2/favicons?sz=128&domain=llamaindex.ai';
    }
    if (name === 'CrewAI') {
      return 'https://www.google.com/s2/favicons?sz=128&domain=crewai.com';
    }
    if (name === 'AutoGen') {
      return 'https://www.google.com/s2/favicons?sz=256&domain=microsoft.com';
    }
    if (name === 'Vercel AI') {
      return 'https://cdn.simpleicons.org/vercel';
    }
    if (name === 'MCP') {
      return 'https://cdn.simpleicons.org/anthropic';
    }
    if (name === 'Kagent' || name === 'kAgent') {
      return 'https://www.google.com/s2/favicons?sz=256&domain=kagent.dev';
    }
    if (name === 'AWS') {
      return 'https://www.google.com/s2/favicons?sz=128&domain=aws.amazon.com';
    }
    if (name === 'Microsoft') {
      return 'https://www.google.com/s2/favicons?sz=256&domain=microsoft.com';
    }
    if (name === 'Gemini') {
      return 'https://www.google.com/s2/favicons?sz=256&domain=deepmind.google';
    }
    // Check domain-based fallbacks
    if (LOGO_FALLBACKS[domain]) {
      return LOGO_FALLBACKS[domain];
    }
    return `https://logo.clearbit.com/${domain}`;
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Try Google favicon service as fallback
    const fallbackSrc = `https://www.google.com/s2/favicons?sz=256&domain=${domain}`;
    if (e.currentTarget.src !== fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    } else {
      // If both fail, use a placeholder
      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0U1RTdFQiIvPgo8cGF0aCBkPSJNMTIgOEMxMy4xIDggMTQgOC45IDE0IDEwQzE0IDExLjEgMTMuMSAxMiAxMiAxMkMxMC45IDEyIDEwIDExLjEgMTAgMTBDMTAgOC45IDEwLjkgOCAxMiA4Wk0xMiAxNEMxMy4xIDE0IDE0IDE0LjkgMTQgMTZDMTQgMTcuMSAxMy4xIDE4IDEyIDE4QzEwLjkgMTggMTAgMTcuMSAxMCAxNkMxMCAxNC45IDEwLjkgMTQgMTIgMTRaIiBmaWxsPSIjOUI5Q0E0Ii8+Cjwvc3ZnPgo=';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 hover:bg-white rounded-lg transition-all">
      <img
        src={getLogoSrc()}
        alt={name}
        className="h-12 w-12 object-contain"
        style={{ filter: 'grayscale(100%) contrast(1.2)' }}
        onError={handleError}
      />
      <span className="text-sm font-medium text-gray-600">{name}</span>
    </div>
  );
}
