'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50" role="banner">
      <nav className="container mx-auto max-w-[1440px] px-4" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <img
              src="/assets/brand/ossa-logo.svg"
              alt="OSSA Logo"
              className="h-10 w-10 transition-transform group-hover:scale-110"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OSSA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6 text-sm lg:text-base">
            <Link href="/about" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/about') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              About
            </Link>
            <Link href="/specification" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/specification') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              Specification
            </Link>
            <Link href="/schema" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/schema') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              Schema
            </Link>
            <Link href="/docs" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/docs') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              Docs
            </Link>
            <Link href="/blog" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/blog') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              Blog
            </Link>
            <Link href="/playground" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/playground') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              Playground
            </Link>
            <Link href="/examples" className={`px-3 py-2 rounded-lg transition-all font-medium whitespace-nowrap ${isActive('/examples') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}>
              Examples
            </Link>
            <a
              href="https://github.com/blueflyio/openstandardagents"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-primary transition-colors flex items-center font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="View on GitHub (opens in new tab)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
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
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100 py-4 border-t border-gray-300' : 'max-h-0 opacity-0'
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
            <Link
              href="/about"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/about') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/specification"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/specification') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Specification
            </Link>
            <Link
              href="/schema"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/schema') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Schema
            </Link>
            <Link
              href="/docs"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/docs') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/blog"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/blog') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/playground"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/playground') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Playground
            </Link>
            <Link
              href="/examples"
              className={`block px-4 py-3 min-h-[44px] rounded-lg transition-all font-medium ${isActive('/examples') ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-primary hover:bg-primary/5'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Examples
            </Link>
            <a
              href="https://github.com/blueflyio/openstandardagents"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2 text-gray-600 hover:text-primary transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="View on GitHub (opens in new tab)"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
      </nav>
    </header>
  );
}

