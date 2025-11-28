import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Ecosystem - Open Standard Agents',
  description: 'Explore OSSA framework support, integrations, and runtime compatibility across the AI agent ecosystem.',
};

interface FrameworkSupport {
  name: string;
  status: 'Supported' | 'Native' | 'Planned';
  migrationGuide?: string;
  example?: string;
  notes: string;
  logo?: string;
}

const frameworks: FrameworkSupport[] = [
  {
    name: 'kAgent',
    status: 'Native',
    example: '/examples#kagent',
    notes: 'Native OSSA implementation - built from the ground up on OSSA specification',
    logo: '🚀',
  },
  {
    name: 'LangChain',
    status: 'Supported',
    migrationGuide: '/docs/ecosystem/framework-support#langchain',
    example: '/examples#langchain',
    notes: 'Full support for LangChain agents with OSSA manifest compatibility',
    logo: '🦜',
  },
  {
    name: 'CrewAI',
    status: 'Supported',
    migrationGuide: '/docs/ecosystem/framework-support#crewai',
    example: '/examples#crewai',
    notes: 'Multi-agent crew orchestration with OSSA coordination',
    logo: '⚓',
  },
  {
    name: 'Anthropic MCP',
    status: 'Supported',
    migrationGuide: '/docs/ecosystem/framework-support#mcp',
    example: '/examples#mcp',
    notes: 'Model Context Protocol integration for Claude and other models',
    logo: '🔌',
  },
  {
    name: 'Langflow',
    status: 'Supported',
    migrationGuide: '/docs/ecosystem/framework-support#langflow',
    example: '/examples#langflow',
    notes: 'Visual flow-based agent builder with OSSA export',
    logo: '🌊',
  },
  {
    name: 'Drupal ECA',
    status: 'Supported',
    migrationGuide: '/docs/ecosystem/framework-support#drupal-eca',
    example: '/examples#drupal',
    notes: 'Event-Condition-Action framework integration for Drupal CMS',
    logo: '💧',
  },
  {
    name: 'OpenAI Assistants',
    status: 'Supported',
    migrationGuide: '/docs/ecosystem/framework-support#openai-assistants',
    example: '/examples#openai',
    notes: 'OpenAI Assistants API with OSSA manifest support',
    logo: '🤖',
  },
];

interface RuntimeSupport {
  name: string;
  status: 'Supported' | 'Beta' | 'Planned';
  notes: string;
  logo: string;
}

const runtimes: RuntimeSupport[] = [
  {
    name: 'Docker',
    status: 'Supported',
    notes: 'Container-based deployment with full OSSA manifest support',
    logo: '🐳',
  },
  {
    name: 'Kubernetes',
    status: 'Supported',
    notes: 'Cloud-native orchestration with autoscaling and service mesh',
    logo: '☸️',
  },
  {
    name: 'AWS Lambda',
    status: 'Supported',
    notes: 'Serverless execution with event-driven agent invocation',
    logo: '⚡',
  },
  {
    name: 'Google Cloud Functions',
    status: 'Supported',
    notes: 'Serverless deployment on Google Cloud Platform',
    logo: '☁️',
  },
  {
    name: 'Azure Functions',
    status: 'Supported',
    notes: 'Serverless compute service on Microsoft Azure',
    logo: '🔷',
  },
  {
    name: 'Cloudflare Workers',
    status: 'Beta',
    notes: 'Edge computing with global distribution',
    logo: '🌐',
  },
];

function StatusBadge({ status }: { status: string }) {
  const colors = {
    Supported: 'bg-green-100 text-green-800 border-green-300',
    Native: 'bg-blue-100 text-blue-800 border-blue-300',
    Planned: 'bg-gray-100 text-gray-800 border-gray-300',
    Beta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

export default function EcosystemPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">OSSA Ecosystem</h1>
        <p className="text-xl text-gray-700 mb-12">
          Explore framework support, integrations, and runtime compatibility across the Open Standard Agents ecosystem.
          OSSA enables interoperability between AI agent frameworks and deployment flexibility across cloud platforms.
        </p>

        {/* Framework Support Matrix */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6 text-primary">Framework Support</h2>
          <p className="text-lg text-gray-700 mb-8">
            OSSA provides compatibility layers for popular AI agent frameworks, enabling you to standardize
            agent definitions while preserving framework-specific features.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Framework</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Migration Guide</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Example</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {frameworks.map((framework, index) => (
                  <tr key={framework.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium">
                      <span className="text-2xl mr-2">{framework.logo}</span>
                      {framework.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={framework.status} />
                    </td>
                    <td className="px-6 py-4">
                      {framework.migrationGuide ? (
                        <Link href={framework.migrationGuide} className="text-primary hover:underline">
                          View Guide
                        </Link>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {framework.example ? (
                        <Link href={framework.example} className="text-primary hover:underline">
                          View Example
                        </Link>
                      ) : (
                        <span className="text-gray-400">Coming Soon</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{framework.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Runtime Compatibility */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6 text-primary">Runtime Compatibility</h2>
          <p className="text-lg text-gray-700 mb-8">
            Deploy OSSA-compliant agents across multiple cloud platforms and execution environments.
            The specification ensures consistent behavior regardless of deployment target.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runtimes.map((runtime) => (
              <Card key={runtime.name} variant="default" padding="md" elevation={1} hover>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{runtime.logo}</span>
                  <StatusBadge status={runtime.status} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{runtime.name}</h3>
                <p className="text-gray-600">{runtime.notes}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Integration Ecosystem */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6 text-primary">Integration Ecosystem</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="default" padding="md" elevation={1}>
              <CardHeader>
                <CardTitle className="text-primary">Tool Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>MCP Servers:</strong> Native Model Context Protocol support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>OpenAPI/REST:</strong> Standard HTTP API integration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>GraphQL:</strong> Query-based data fetching</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>gRPC:</strong> High-performance RPC protocols</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>WebSockets:</strong> Real-time bidirectional communication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="default" padding="md" elevation={1}>
              <CardHeader>
                <CardTitle className="text-primary">Data Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Vector Databases:</strong> Pinecone, Weaviate, Qdrant</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>SQL Databases:</strong> PostgreSQL, MySQL, SQLite</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>NoSQL:</strong> MongoDB, Redis, DynamoDB</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Message Queues:</strong> RabbitMQ, Kafka, SQS</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Object Storage:</strong> S3, GCS, Azure Blob</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="default" padding="md" elevation={1}>
              <CardHeader>
                <CardTitle className="text-primary">Monitoring & Observability</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>OpenTelemetry:</strong> Distributed tracing support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Prometheus:</strong> Metrics collection and alerting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Grafana:</strong> Visualization and dashboards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Sentry:</strong> Error tracking and reporting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>DataDog:</strong> Full-stack monitoring</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card variant="default" padding="md" elevation={1}>
              <CardHeader>
                <CardTitle className="text-primary">CI/CD & DevOps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>GitHub Actions:</strong> Automated testing and deployment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>GitLab CI/CD:</strong> Pipeline automation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Jenkins:</strong> Continuous integration server</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>ArgoCD:</strong> GitOps continuous delivery</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span><strong>Terraform:</strong> Infrastructure as code</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Community & Resources */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold mb-6 text-primary">Community & Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/docs/ecosystem/overview">
              <Card variant="interactive" padding="md" elevation={1} className="h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Ecosystem Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">Learn about the OSSA ecosystem architecture and integration patterns.</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/docs/ecosystem/framework-support">
              <Card variant="interactive" padding="md" elevation={1} className="h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Framework Support Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">Detailed compatibility information and migration guides for each framework.</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/examples">
              <Card variant="interactive" padding="md" elevation={1} className="h-full">
                <CardHeader>
                  <CardTitle className="text-primary">Integration Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">Real-world examples of OSSA integrations across frameworks and platforms.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Build on OSSA</h2>
          <p className="text-lg mb-6">
            Ready to integrate OSSA into your framework or platform? Our specification is open source
            and designed for extensibility.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/docs/getting-started/5-minute-overview" className="btn-secondary">
              Get Started
            </Link>
            <Link href="/specification" className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Read Specification
            </Link>
            <Link href="https://github.com/blueflyio/openstandardagents/issues" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors">
              Request Integration
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
