import Link from 'next/link';

export function Footer(): JSX.Element {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Open Standard Agents</h3>
            <p className="text-sm">
              Industry Standard for Agent Orchestration. The vendor-neutral specification for multi-agent systems.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Documentation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs/getting-started" className="hover:text-white transition-colors">
                  Getting Started
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white transition-colors">
                  Full Documentation
                </Link>
              </li>
              <li>
                <Link href="/schema" className="hover:text-white transition-colors">
                  Schema Reference
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/examples" className="hover:text-white transition-colors">
                  Examples
                </Link>
              </li>
              <li>
                <Link href="/playground" className="hover:text-white transition-colors">
                  Playground
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://gitlab.bluefly.io/llm/openstandardagents"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitLab Repository
                </a>
              </li>
              <li>
                <a
                  href="https://gitlab.bluefly.io/llm/openstandardagents/-/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/@openstandardagents/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  npm Package
                </a>
              </li>
              <li>
                <a
                  href="https://openstandardagents.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Website
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-sm text-center">
          <p>
            © {new Date().getFullYear()} Open Standard Agents Organization. Licensed under{' '}
            <a
              href="https://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
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

