'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DocsSearch } from './DocsSearch';
import { VersionSelector } from './VersionSelector';

const navigation = [
  {
    title: 'Getting Started',
    items: [
      { href: '/docs/getting-started/5-minute-overview', label: '5-Minute Overview' },
      { href: '/docs/getting-started/installation', label: 'Installation' },
      { href: '/docs/getting-started/hello-world', label: 'Hello World' },
      { href: '/docs/getting-started/first-agent', label: 'First Agent' },
    ],
  },
  {
    title: 'For Audiences',
    items: [
      { href: '/docs/for-audiences/developers', label: 'Developers' },
      { href: '/docs/for-audiences/architects', label: 'Architects' },
      { href: '/docs/for-audiences/enterprises', label: 'Enterprises' },
      { href: '/docs/for-audiences/students-researchers', label: 'Students & Researchers' },
    ],
  },
  {
    title: 'Migration Guides',
    items: [
      { href: '/docs/migration-guides/anthropic-mcp-to-ossa', label: 'Anthropic MCP to OSSA' },
      { href: '/docs/migration-guides/openai-to-ossa', label: 'OpenAI to OSSA' },
      { href: '/docs/migration-guides/langchain-to-ossa', label: 'LangChain to OSSA' },
      { href: '/docs/migration-guides/crewai-to-ossa', label: 'CrewAI to OSSA' },
      { href: '/docs/migration-guides/langflow-to-ossa', label: 'Langflow to OSSA' },
      { href: '/docs/migration-guides/drupal-eca-to-ossa', label: 'Drupal ECA to OSSA' },
    ],
  },
  {
    title: 'Ecosystem',
    items: [
      { href: '/docs/ecosystem/overview', label: 'Ecosystem Overview' },
      { href: '/docs/ecosystem/framework-support', label: 'Framework Support' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { href: '/docs/openapi-extensions', label: 'OpenAPI Extensions' },
      { href: '/docs/quick-reference', label: 'Quick Reference' },
      { href: '/docs/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Contributing',
    items: [
      { href: '/docs/contributing', label: 'Contributing Guide' },
      { href: '/docs/aiflow-framework-integration-with-ossa', label: 'AIFlow Framework Integration' },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  // Calculate initial open sections based on pathname to avoid hydration mismatch
  const getInitialOpenSections = (): string[] => {
    const sections: string[] = ['Getting Started'];
    const currentSection = navigation.find((section) =>
      section.items.some((item) => item.href === pathname)
    );
    if (currentSection && !sections.includes(currentSection.title)) {
      sections.push(currentSection.title);
    }
    return sections;
  };

  const [openSections, setOpenSections] = useState<string[]>(getInitialOpenSections);

  // Update open sections when pathname changes (for client-side navigation)
  useEffect(() => {
    const currentSection = navigation.find((section) =>
      section.items.some((item) => item.href === pathname)
    );

    if (currentSection) {
      setOpenSections((prev) => {
        // Only add if not already in the array
        if (!prev.includes(currentSection.title)) {
          return [...prev, currentSection.title];
        }
        return prev;
      });
    }
  }, [pathname]);

  const toggleSection = (title: string): void => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto h-screen sticky top-0">
      <nav>
        <Link href="/docs" className="block mb-6 font-semibold text-primary hover:text-primary-dark">
          Documentation
        </Link>
        <div className="mb-6">
          <DocsSearch />
        </div>
        <div className="mb-6">
          <VersionSelector />
        </div>
        {navigation.map((section) => (
          <div key={section.title} className="mb-4">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full text-left font-semibold text-gray-900 mb-2 flex items-center justify-between"
            >
              <span>{section.title}</span>
              <span className="text-gray-500">
                {openSections.includes(section.title) ? '−' : '+'}
              </span>
            </button>
            {openSections.includes(section.title) && (
              <ul className="space-y-1 ml-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block px-2 py-1 rounded text-sm transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

