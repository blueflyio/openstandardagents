'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Header(): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <nav className="container mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">OSSA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/about" className="text-gray-700 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/specification" className="text-gray-700 hover:text-primary transition-colors">
              Specification
            </Link>
            <Link href="/docs" className="text-gray-700 hover:text-primary transition-colors">
              Documentation
            </Link>
            <Link href="/schema" className="text-gray-700 hover:text-primary transition-colors">
              Schema
            </Link>
            <Link href="/playground" className="text-gray-700 hover:text-primary transition-colors">
              Playground
            </Link>
            <Link href="/examples" className="text-gray-700 hover:text-primary transition-colors">
              Examples
            </Link>
            <a
              href="https://gitlab.bluefly.io/llm/openstandardagents"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              GitLab
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden py-4 border-t border-gray-300"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <Link
              href="/about"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/specification"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Specification
            </Link>
            <Link
              href="/docs"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </Link>
            <Link
              href="/schema"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Schema
            </Link>
            <Link
              href="/playground"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Playground
            </Link>
            <Link
              href="/examples"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Examples
            </Link>
            <a
              href="https://gitlab.bluefly.io/llm/openstandardagents"
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              GitLab
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}

