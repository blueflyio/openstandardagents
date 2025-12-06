import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4" role="contentinfo">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <section aria-labelledby="footer-about">
            <h3 id="footer-about" className="text-white font-semibold mb-4">Open Standard Agents</h3>
            <p className="text-sm">
              OSSA is an open standard for AI agents. The vendor-neutral specification was created by{' '}
              <a href="https://www.linkedin.com/in/thomasscola/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Thomas Scola</a>, founder of{' '}
              <a href="https://bluefly.io" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">Bluefly.io</a>.
            </p>
          </section>
          <nav aria-labelledby="footer-docs">
            <h4 id="footer-docs" className="text-white font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <Link href="/docs/getting-started" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Full Documentation
                </Link>
              </li>
              <li>
                <Link href="/schema" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Schema Reference
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-resources">
            <h4 id="footer-resources" className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <Link href="/examples" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Examples
                </Link>
              </li>
              <li>
                <Link href="/playground" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Playground
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/design-guide" className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                  Design Guide
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="footer-community">
            <h4 id="footer-community" className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <a
                  href="https://github.com/blueflyio/openstandardagents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="GitHub repository (opens in new tab)"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/blueflyio/openstandardagents/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="GitHub Issues (opens in new tab)"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/@bluefly/openstandardagents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="npm package (opens in new tab)"
                >
                  npm Package
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-gray-700 pt-8 text-sm text-center">
          <p>
            © {new Date().getFullYear()} Open Standard Agents Organization. Licensed under{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
              aria-label="Apache 2.0 License (opens in new tab)"
            >
              Apache 2.0
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

