import { DocsSidebar } from '@/components/docs/DocsSidebar';
import Link from 'next/link';

export default function ProjectStructurePage() {
  return (
    <div className="flex min-h-screen">
      <DocsSidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
          <article className="prose prose-lg max-w-none">
            <h1>OSSA Project Structure</h1>
            <p className="text-xl text-gray-600">
              Understanding the .agents and .agents-workspace folders, and how OSSA organizes agent projects
            </p>

            <div className="mt-8">
              <p>Understanding how OSSA organizes your agent projects is essential for effective development. This guide explains the core folders and their purposes.</p>

              <h2>Directory Structure Overview</h2>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`my-ossa-project/
├── .agents/                    # Agent definitions (version controlled)
│   ├── my-agent/
│   │   ├── manifest.json      # Agent configuration
│   │   ├── prompts/           # Agent prompts
│   │   └── tools/             # Agent-specific tools
│   └── another-agent/
│       └── manifest.json
├── .agents-workspace/          # Agent runtime workspace (NOT version controlled)
│   ├── my-agent/
│   │   ├── context/           # Runtime context
│   │   ├── memory/            # Agent memory/state
│   │   └── logs/              # Execution logs
│   └── another-agent/
│       └── context/
├── examples/                   # Example agents and workflows
└── ossa.yaml                   # Project configuration`}
              </pre>

              <h2><code>.agents/</code> - Agent Definitions</h2>

              <p>The <code>.agents/</code> directory contains your <strong>agent definitions</strong>. This folder <strong>should be version controlled</strong> (committed to git).</p>

              <h3>Purpose</h3>

              <ul>
                <li><strong>Declarative agent configuration</strong>: Each agent is defined by a <code>manifest.json</code> file</li>
                <li><strong>Source of truth</strong>: The canonical definition of what each agent does</li>
                <li><strong>Shareable</strong>: Can be exported, migrated, and shared across teams</li>
                <li><strong>Platform-agnostic</strong>: Works with any OSSA-compliant runtime</li>
              </ul>

              <h3>Structure</h3>

              <p>Each agent gets its own subdirectory within <code>.agents/</code>:</p>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`.agents/
└── customer-support-agent/
    ├── manifest.json           # Required: Agent metadata and configuration
    ├── prompts/
    │   ├── system.md          # System prompt
    │   ├── context.md         # Context instructions
    │   └── examples.md        # Few-shot examples
    ├── tools/
    │   ├── search.json        # Tool definition
    │   └── create-ticket.json # Tool definition
    └── schema/
        └── openapi.yaml       # OpenAPI schema if using x-ossa extensions`}
              </pre>

              <h3>manifest.json</h3>

              <p>The manifest is the core of each agent. It defines:</p>

              <ul>
                <li><strong>Agent metadata</strong>: Name, description, version</li>
                <li><strong>Capabilities</strong>: What the agent can do</li>
                <li><strong>Tools</strong>: Which tools the agent has access to</li>
                <li><strong>Configuration</strong>: Runtime settings and parameters</li>
                <li><strong>Taxonomy</strong>: Agent classification (see below)</li>
              </ul>

              <p>Example manifest:</p>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "name": "customer-support-agent",
  "version": "1.0.0",
  "description": "Handles customer support inquiries",
  "taxonomy": {
    "role": "worker",
    "domain": "customer-service",
    "capabilities": ["qa", "ticket-creation", "escalation"]
  },
  "tools": [
    {
      "name": "search_knowledge_base",
      "type": "function",
      "source": "./tools/search.json"
    },
    {
      "name": "create_support_ticket",
      "type": "function",
      "source": "./tools/create-ticket.json"
    }
  ],
  "prompts": {
    "system": "./prompts/system.md",
    "context": "./prompts/context.md"
  }
}`}
              </pre>

              <h2><code>.agents-workspace/</code> - Agent Runtime Workspace</h2>

              <p>The <code>.agents-workspace/</code> directory is where agents <strong>run and store runtime data</strong>. This folder <strong>should NOT be version controlled</strong> (add to <code>.gitignore</code>).</p>

              <h3>Purpose</h3>

              <ul>
                <li><strong>Execution environment</strong>: Where agents execute tasks</li>
                <li><strong>State management</strong>: Agent memory, context, and session data</li>
                <li><strong>Logs and telemetry</strong>: Runtime logs, metrics, and debugging info</li>
                <li><strong>Temporary artifacts</strong>: Generated files, cached data, etc.</li>
              </ul>

              <h3>Structure</h3>

              <p>Each agent gets a workspace directory that mirrors its <code>.agents/</code> structure:</p>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`.agents-workspace/
└── customer-support-agent/
    ├── context/
    │   ├── session-abc123.json    # Active session context
    │   └── thread-xyz789.json     # Conversation thread
    ├── memory/
    │   ├── short-term.json        # Recent context window
    │   ├── long-term.db           # Persistent memory (vector store)
    │   └── preferences.json       # Learned user preferences
    ├── logs/
    │   ├── 2025-11-18.log         # Daily logs
    │   └── metrics.json           # Performance metrics
    └── artifacts/
        ├── generated-email.txt    # Generated content
        └── analysis-report.pdf    # Work products`}
              </pre>

              <h3>Why Separate from <code>.agents/</code>?</h3>

              <ol>
                <li><strong>Clean version control</strong>: Don't pollute git with runtime data</li>
                <li><strong>Security</strong>: Keep sensitive runtime data (API keys, user data) out of version control</li>
                <li><strong>Performance</strong>: Large runtime files don't slow down git operations</li>
                <li><strong>Reproducibility</strong>: Agent definitions in <code>.agents/</code> can be reproduced anywhere, but runtime state is environment-specific</li>
              </ol>

              <h3><code>.gitignore</code> Recommendation</h3>

              <p>Always add <code>.agents-workspace/</code> to your <code>.gitignore</code>:</p>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`# OSSA runtime workspace (never commit this!)
.agents-workspace/

# Keep agent definitions (DO commit this)
# .agents/  # <-- NOT ignored, should be committed`}
              </pre>

              <h2 id="agent-taxonomy">Agent Taxonomy</h2>

              <p>OSSA uses a <strong>taxonomy system</strong> to classify and organize agents. This helps with:</p>

              <ul>
                <li><strong>Discovery</strong>: Find agents by role, domain, or capability</li>
                <li><strong>Routing</strong>: Direct tasks to appropriate agents</li>
                <li><strong>Orchestration</strong>: Compose multi-agent workflows</li>
                <li><strong>Governance</strong>: Apply policies based on agent classification</li>
              </ul>

              <h3>Taxonomy Structure</h3>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "taxonomy": {
    "role": "worker | supervisor | coordinator | specialist",
    "domain": "customer-service | data-analysis | content-creation | ...",
    "capabilities": ["capability-1", "capability-2", "..."],
    "tags": ["optional", "custom", "tags"]
  }
}`}
              </pre>

              <h3>Taxonomy Fields</h3>

              <h4><code>role</code> (Required)</h4>

              <p>The agent's primary role in a system:</p>

              <ul>
                <li><strong><code>worker</code></strong>: Executes specific tasks (e.g., customer support agent, data fetcher)</li>
                <li><strong><code>supervisor</code></strong>: Manages and coordinates workers (e.g., team lead, orchestrator)</li>
                <li><strong><code>coordinator</code></strong>: Routes tasks between agents (e.g., dispatcher, load balancer)</li>
                <li><strong><code>specialist</code></strong>: Domain expert for complex tasks (e.g., legal advisor, data scientist)</li>
              </ul>

              <h4><code>domain</code> (Required)</h4>

              <p>The business/functional domain:</p>

              <ul>
                <li><code>customer-service</code></li>
                <li><code>data-analysis</code></li>
                <li><code>content-creation</code></li>
                <li><code>software-development</code></li>
                <li><code>compliance</code></li>
                <li><code>sales</code></li>
                <li>(custom domains allowed)</li>
              </ul>

              <h4><code>capabilities</code> (Optional but Recommended)</h4>

              <p>Specific capabilities the agent possesses:</p>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "capabilities": [
    "natural-language-understanding",
    "ticket-creation",
    "escalation-routing",
    "sentiment-analysis",
    "multi-language-support"
  ]
}`}
              </pre>

              <h4><code>tags</code> (Optional)</h4>

              <p>Freeform tags for additional classification:</p>

              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "tags": ["production", "high-priority", "customer-facing", "v2"]
}`}
              </pre>

              <h3>Example Taxonomy Usage</h3>

              <p><strong>Worker Agent (Customer Support)</strong>:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "taxonomy": {
    "role": "worker",
    "domain": "customer-service",
    "capabilities": ["qa", "ticket-creation", "escalation"],
    "tags": ["tier-1-support", "email-only"]
  }
}`}
              </pre>

              <p><strong>Supervisor Agent (Support Team Lead)</strong>:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "taxonomy": {
    "role": "supervisor",
    "domain": "customer-service",
    "capabilities": ["task-assignment", "quality-review", "escalation-handling"],
    "tags": ["tier-2-support", "manager"]
  }
}`}
              </pre>

              <p><strong>Specialist Agent (Data Analyst)</strong>:</p>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`{
  "taxonomy": {
    "role": "specialist",
    "domain": "data-analysis",
    "capabilities": ["sql-queries", "data-visualization", "statistical-analysis"],
    "tags": ["python", "pandas", "power-bi"]
  }
}`}
              </pre>

              <h2>Best Practices</h2>

              <h3>✅ DO</h3>

              <ul>
                <li><strong>Commit <code>.agents/</code></strong> to version control (git)</li>
                <li><strong>Ignore <code>.agents-workspace/</code></strong> in <code>.gitignore</code></li>
                <li><strong>Use taxonomy</strong> to classify all agents</li>
                <li><strong>Document agent roles</strong> in manifest descriptions</li>
                <li><strong>Version your manifests</strong> (semver recommended)</li>
              </ul>

              <h3>❌ DON'T</h3>

              <ul>
                <li><strong>Don't commit <code>.agents-workspace/</code></strong> (contains runtime data, secrets, logs)</li>
                <li><strong>Don't hardcode secrets</strong> in agent manifests (use environment variables)</li>
                <li><strong>Don't mix runtime state</strong> with agent definitions</li>
                <li><strong>Don't skip taxonomy</strong> (makes discovery and routing harder)</li>
              </ul>

              <h2>Summary</h2>

              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Folder</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Purpose</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Version Control</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold">Contains</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-4 text-sm"><code>.agents/</code></td>
                    <td className="px-3 py-4 text-sm">Agent definitions</td>
                    <td className="px-3 py-4 text-sm">✅ YES</td>
                    <td className="px-3 py-4 text-sm">Manifests, prompts, tool definitions</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-4 text-sm"><code>.agents-workspace/</code></td>
                    <td className="px-3 py-4 text-sm">Agent runtime</td>
                    <td className="px-3 py-4 text-sm">❌ NO</td>
                    <td className="px-3 py-4 text-sm">Logs, memory, context, artifacts</td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-4"><strong>Key Takeaway</strong>: <code>.agents/</code> defines <strong>what</strong> agents do (commit to git). <code>.agents-workspace/</code> is <strong>where</strong> they work (never commit).</p>

              <h2>Next Steps</h2>

              <ul>
                <li><Link href="/docs/getting-started/first-agent" className="text-primary hover:underline">Create Your First Agent</Link></li>
                <li><Link href="/docs/quick-reference" className="text-primary hover:underline">Agent Manifest Reference</Link></li>
                <li><Link href="/examples" className="text-primary hover:underline">Multi-Agent Examples</Link></li>
              </ul>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
