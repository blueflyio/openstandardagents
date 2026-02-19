#!/usr/bin/env tsx

/**
 * Update existing GitLab issues with bodies from Research.
 * Lists open issues, matches by title, PATCHes description/labels/milestone.
 *
 * Usage:
 *   GITLAB_TOKEN=<token> npx tsx src/tools/gitlab/update-existing-issues.ts [--dry-run]
 *
 * Token: GITLAB_TOKEN | SERVICE_ACCOUNT_OSSA_TOKEN | GITLAB_PUSH_TOKEN
 */

import fs from 'fs';
import path from 'path';
import { Gitlab } from '@gitbeaker/rest';

const GITLAB_API_URL = process.env.CI_API_V4_URL || 'https://gitlab.com/api/v4';
const GITLAB_TOKEN =
  process.env.SERVICE_ACCOUNT_OSSA_TOKEN ||
  process.env.GITLAB_TOKEN ||
  process.env.GITLAB_PUSH_TOKEN ||
  '';
const PROJECT_ID =
  process.env.CI_PROJECT_ID || process.env.GITLAB_PROJECT_ID || 'blueflyio/ossa/openstandardagents';

const NAS_WEBSITE_AUDIT_BODY =
  '/Volumes/AgentPlatform/applications/Research/openstandardagents/website/gitlab-issue-ossa-website-audit.md';

type IssueUpdate = {
  titleMatch: string | RegExp;
  description: string;
  labels?: string[];
  milestone?: string;
  dueDate?: string;
};

function getWebsiteAuditBody(): string {
  if (!fs.existsSync(NAS_WEBSITE_AUDIT_BODY)) {
    return '';
  }
  const raw = fs.readFileSync(NAS_WEBSITE_AUDIT_BODY, 'utf-8');
  const start = raw.indexOf('## Summary');
  const end = raw.indexOf('/label ~');
  if (start === -1) return raw;
  return raw.slice(start, end === -1 ? undefined : end).trim();
}

function buildIssueUpdates(): IssueUpdate[] {
  const websiteBody = getWebsiteAuditBody();
  return [
    {
      titleMatch: /Website positioning|SEO|trust signals|competitive landscape|critical fixes/i,
      description:
        websiteBody ||
        '[AUDIT] Website positioning, SEO, trust signals, competitive landscape. See Research website/gitlab-issue-ossa-website-audit.md for full body.',
      labels: ['priority::critical', 'type::improvement', 'website', 'strategy'],
      milestone: 'v0.4.0',
      dueDate: '2026-03-15',
    },
    {
      titleMatch: /v0\.4 agent schema|team|subagents|taxonomy/i,
      description: `**Target:** spec/v0.4/agent.schema.json
- Add: agentKind (team-lead, teammate, subagent, researcher, debugger), agentType (a2a, mcp-server, agent-sdk, adk), pattern (lead-teammate)
- Add: Enhanced coordination (taskPersistence file-backed, dependencyTracking, waveExecution, deployment.backend, conflictResolution leader-decides)
- Add: spec.team (model, lead, delegateMode, members[], taskList, communication, deployment)
- Add: spec.subagents[] (name, kind, role, model, tools, contextIsolation, reportTo, maxTokenBudget)
- Validate against example manifests in wiki and spec/ossa-schema-updates.md
- Update team-generator.service.ts per spec/ossa-architecture-validation.md (6 corrections)
Ref: Research spec/ folder and openstandardagents wiki.`,
      labels: ['type::feature', 'spec', 'multi-agent'],
      milestone: 'v0.4.0',
    },
    {
      titleMatch: /Phase 0|Fix build|dead imports|SDK-first adapter/i,
      description: `**Current:** Build fails (AgentsMdService, MemoryBroker, GitLabReleaseCommands removed but still imported). 78% of adapters without official SDK; 3,096 LOC dead; 2,731 LOC duplicated.
**Tasks:** (1) Restore or remove references so build passes. (2) SDK-first policy: no adapter output importing non-existent packages; stub with TODO where SDK missing. (3) Tier adapters: Tier 1 CrewAI, MCP, NPM, OpenAI Agents SDK; Tier 2 partial; Tier 3 stub-only. (4) Document adapter status in CLI (ossa export --list-platforms with production/beta/alpha/planned).
**Success:** npx tsc --noEmit clean; no broken imports; honest status in CLI and README.
Ref: Research roadmaps-prds/PRD-OSSA-SKILLS-RESEARCHER-GENERATOR-EXPORTER.md (Phase 0).`,
      labels: ['type::technical_debt', 'priority::high'],
      milestone: 'v0.4.0',
    },
    {
      titleMatch: /GitLab agent|OSSA v0.4 extension|ossa export gitlab/i,
      description: `**Goal:** gitlab-agent_ossa uses OSSA v0.4 schema and CLI for validation/generation/migration.
**Tasks:** (1) Create GitLab extension schema under spec/v0.4/extensions/gitlab/. (2) Add ossa export gitlab and document. (3) Test migration path v0.3.2 to v0.4. (4) Document case study.
Ref: Research roadmaps-prds/GITLAB-AGENT-ENHANCEMENT.md.`,
      labels: ['type::feature', 'gitlab', 'integration'],
      milestone: 'v0.4.0',
    },
    {
      titleMatch: /Publish.*@bluefly.*openstandardagents|public npm/i,
      description: `**Acceptance:** npm install -g @bluefly/openstandardagents works from public registry; ossa --version and ossa --help show honest status; package.json and README reflect actual capabilities (infrastructure bridge, not "industry standard").
**Prerequisite:** Phase 0 build fix and adapter status clarity.`,
      labels: ['type::deployment', 'priority::high'],
      milestone: 'v0.4.0',
    },
    {
      titleMatch: /ossa skills research|generate|export|Claude Skills pipeline/i,
      description: `**Scope:** PRD Goals G2–G4: ossa skills research, ossa skills generate (OSSA/Oracle/AGENTS.md/A2A), ossa skills export (npm package for .claude/skills/). P0 acceptance from PRD.
**Prerequisite:** Phase 0 complete; schema v0.4 if skills reference team/subagents.
Ref: Wiki and Research roadmaps-prds/PRD-OSSA-SKILLS-RESEARCHER-GENERATOR-EXPORTER.md.`,
      labels: ['type::feature', 'skills', 'cli'],
      milestone: 'v0.4.x',
    },
    {
      titleMatch: /Fix search indexing|remove overclaims|audit items 1–2/i,
      description: `Subset of Website audit: (1) Verify SSR/pre-render, sitemap.xml, robots.txt, canonical URLs, JSON-LD, Search Console/Webmaster Tools, crawlable links. (2) Audit all pages for unsubstantiated claims; replace with honest status; add "Status: Pre-release / Seeking Early Adopters" where appropriate.
Can be sub-issues of Website audit or single implementation issue.`,
      labels: ['website', 'priority::critical'],
      milestone: 'v0.4.0',
    },
    {
      titleMatch: /canonical version|/ecosystem/|positioning page/i,
      description: `(1) One version number across site, GitHub README, npm, changelog; update title/meta and version badge. (2) Add /ecosystem/ or /landscape/ page: stack diagram (contract layer between protocols and platforms), honest comparison with AGNTCY, ADL, ANS, LOKA, Entra; "why OSSA" in context.
Ref: Audit items 3–4; Research website/ossa-website-content-guide.md.`,
      labels: ['website', 'strategy'],
      milestone: 'v0.4.0',
    },
  ];
}

function titleMatches(issueTitle: string, match: string | RegExp): boolean {
  if (typeof match === 'string') return issueTitle.toLowerCase().includes(match.toLowerCase());
  return match.test(issueTitle);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  if (!GITLAB_TOKEN) {
    console.error('No GitLab token. Set GITLAB_TOKEN, SERVICE_ACCOUNT_OSSA_TOKEN, or GITLAB_PUSH_TOKEN');
    process.exit(1);
  }

  const gitlab = new Gitlab({ token: GITLAB_TOKEN, host: GITLAB_API_URL.replace(/\/api\/v4\/?$/, '') });
  const updates = buildIssueUpdates();

  const issues: { iid: number; title: string; description: string }[] = [];
  let page = 1;
  const perPage = 100;
  while (true) {
    const chunk = await gitlab.Issues.all({
      projectId: PROJECT_ID,
      state: 'opened',
      perPage,
      page,
    });
    for (const i of chunk as { iid: number; title: string; description: string }[]) {
      issues.push({ iid: i.iid, title: i.title, description: i.description || '' });
    }
    if (chunk.length < perPage) break;
    page += 1;
  }

  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Open issues: ${issues.length}`);
  if (dryRun) console.log('DRY RUN - no changes will be made\n');

  let updated = 0;
  for (const def of updates) {
    const found = issues.find((i) => titleMatches(i.title, def.titleMatch));
    if (!found) {
      console.log(`No match: "${def.titleMatch}"`);
      continue;
    }
    const payload: { description?: string; labels?: string; milestone_id?: number; due_date?: string } = {};
    if (def.description) payload.description = def.description;
    if (def.labels?.length) payload.labels = def.labels.join(',');
    if (def.dueDate) payload.due_date = def.dueDate;
    if (def.milestone) {
      const milestones = (await gitlab.ProjectMilestones.all(PROJECT_ID)) as { id: number; title: string }[];
      const m = milestones.find((x) => x.title === def.milestone);
      if (m) payload.milestone_id = m.id;
    }

    if (dryRun) {
      console.log(`Would update !${found.iid}: ${found.title}`);
      console.log(`  description length: ${(payload.description || '').length}`);
      if (payload.labels) console.log(`  labels: ${payload.labels}`);
      updated++;
      continue;
    }

    try {
      await gitlab.Issues.edit(PROJECT_ID, found.iid, payload);
      console.log(`Updated !${found.iid}: ${found.title}`);
      updated++;
    } catch (e) {
      console.error(`Failed !${found.iid}: ${(e as Error).message}`);
    }
  }

  console.log(dryRun ? `Would update ${updated} issues.` : `Updated ${updated} issues.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
