import type { Metadata } from 'next';
import fs from 'fs';
import Link from 'next/link';
import path from 'path';

export const metadata: Metadata = {
  title: 'Apache License 2.0 - Open Standard Agents',
  description: 'Review the Apache License 2.0 terms that govern the Open Standard Agents project and ecosystem.',
};

function getLicenseText(): string {
  const licensePath = path.join(process.cwd(), 'public/licenses/apache-2.0.txt');
  return fs.readFileSync(licensePath, 'utf-8');
}

export default function LicensePage() {
  const licenseText = getLicenseText();

  return (
    <>
      <div className="bg-gradient-to-br from-primary via-accent to-secondary text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V20a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">Apache License 2.0</h1>
          <p className="text-xl text-white/90 mb-6">
            The governing open source license for the Open Standard Agents project and its documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#license-text"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary font-semibold rounded-lg shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Read Full Text
            </Link>
            <a
              href="https://opensource.org/licenses/Apache-2.0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold border border-white/30 rounded-lg hover:bg-white/20 transition-all"
            >
              Official License Page
            </a>
            <a
              href="/licenses/apache-2.0.txt"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold border border-white/30 rounded-lg hover:bg-white/20 transition-all"
            >
              Download TXT
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-12">
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l3-3m-3 3l-3-3m9-5h3m-3 0l-3-3m3 3l-3 3M9 12H6m3 0l3-3m-3 3l3 3" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">Permissions</h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Use, modify, and distribute the specification and code</li>
              <li>Commercial and private use allowed</li>
              <li>Patent grants included for contributors</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">Conditions</h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>Preserve copyright and license notices</li>
              <li>Include a NOTICE file when required</li>
              <li>Document significant changes to the work</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9V5a2 2 0 012-2h6a2 2 0 012 2v6m-8 4h6m-6 0l3 3m-3-3l3-3M15 9h.01M5 7h.01M7 5h.01M19 15h.01M7 17h.01M5 19h.01M3 3l18 18" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">Limitations</h2>
            <ul className="space-y-2 text-gray-700 list-disc list-inside">
              <li>No trademark license is granted</li>
              <li>No warranty - software is provided "as is"</li>
              <li>Liability is limited under the terms</li>
            </ul>
          </div>
        </section>

        <section className="bg-gray-50 rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Open Source Commitment</p>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">Why Apache 2.0?</h2>
              <p className="text-lg text-gray-700 mt-3 max-w-3xl">
                Apache 2.0 offers a clear, business-friendly open source model with patent grants, making it safe for
                enterprises, vendors, and researchers to build on the Open Standard Agents specification and ecosystem.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/licenses/apache-2.0.txt"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:-translate-y-0.5 transition-all"
              >
                Download License
              </a>
              <a
                href="https://opensource.org/licenses/Apache-2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-primary font-semibold border border-primary rounded-lg hover:bg-primary/10 transition-all"
              >
                OpenSource.org
              </a>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Using OSSA in your projects</h3>
              <ul className="space-y-2 text-gray-700 leading-relaxed list-disc list-inside">
                <li>Embed the specification, reference implementations, or docs in commercial and open source products.</li>
                <li>Attribute OSSA and retain the license headers in source distributions.</li>
                <li>Contribute improvements knowing patent grants apply to contributions.</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Need attribution text?</h3>
              <p className="text-gray-700 mb-3">
                Include the following notice in your documentation or about pages:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto border border-gray-800">
                Open Standard Agents Initiative - licensed under the Apache License, Version 2.0. You may not use this
                project except in compliance with the License. You may obtain a copy at https://opensource.org/licenses/Apache-2.0
              </div>
            </div>
          </div>
        </section>

        <section id="license-text" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Full Text</p>
              <h2 className="text-3xl font-bold text-gray-900">Apache License, Version 2.0</h2>
            </div>
            <div className="flex gap-3">
              <a
                href="/licenses/apache-2.0.txt"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:-translate-y-0.5 transition-all"
              >
                Download .txt
              </a>
              <a
                href="https://opensource.org/licenses/Apache-2.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-primary font-semibold border border-primary rounded-lg hover:bg-primary/10 transition-all"
              >
                View on OpenSource.org
              </a>
            </div>
          </div>
          <div className="bg-gray-900 text-gray-100 rounded-2xl border border-gray-800 shadow-inner">
            <div className="max-h-[32rem] overflow-y-auto p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{licenseText}</pre>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
