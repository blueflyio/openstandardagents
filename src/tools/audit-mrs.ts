#!/usr/bin/env tsx
/**
 * Audit GitLab Merge Requests for Comments and Action Items
 * 
 * Fetches all open/merged MRs and extracts action items from comments
 * 
 * Usage:
 *   GITLAB_TOKEN=<token> tsx src/tools/audit-mrs.ts
 *   OR
 *   tsx src/tools/audit-mrs.ts <gitlab-token>
 */

import { Gitlab } from '@gitbeaker/node';

const token = process.env.GITLAB_TOKEN || process.argv[2];
const projectId = process.env.CI_PROJECT_ID || 'blueflyio/ossa/openstandardagents';

if (!token) {
  console.error('ERROR: GITLAB_TOKEN not provided');
  console.error('');
  console.error('Usage:');
  console.error('  GITLAB_TOKEN=<token> tsx src/tools/audit-mrs.ts');
  console.error('  OR');
  console.error('  tsx src/tools/audit-mrs.ts <gitlab-token>');
  process.exit(1);
}

const api = new Gitlab({
  host: 'https://gitlab.com',
  token: token,
});

interface ActionItem {
  mr: {
    id: number;
    iid: number;
    title: string;
    state: string;
    web_url: string;
    author: { name: string; username: string };
    created_at: string;
    updated_at: string;
  };
  comment: {
    id: number;
    body: string;
    author: { name: string; username: string };
    created_at: string;
    updated_at: string;
  };
  actionItem: string;
  priority: 'high' | 'medium' | 'low';
}

function extractActionItems(commentBody: string): Array<{ text: string; priority: 'high' | 'medium' | 'low' }> {
  const actionItems: Array<{ text: string; priority: 'high' | 'medium' | 'low' }> = [];
  
  // Patterns for action items
  const patterns = [
    // TODO, FIXME, ACTION, etc.
    /(?:TODO|FIXME|ACTION|HACK|XXX|NOTE|BUG|HACK|OPTIMIZE|REFACTOR|REVIEW|TEST|WARN|DEPRECATED)[\s:]+(.+?)(?:\n|$)/gi,
    // Checkboxes
    /- \[ \]\s*(.+?)(?:\n|$)/gi,
    // Questions ending with ?
    /(?:^|\n)\s*\?\s*(.+?)(?:\n|$)/gi,
    // Directives like "should", "must", "need to"
    /(?:should|must|need to|required to|please)\s+(.+?)(?:\n|$)/gi,
    // Explicit action items
    /(?:action item|action:|action required|action needed)[\s:]+(.+?)(?:\n|$)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(commentBody)) !== null) {
      const text = match[1]?.trim();
      if (text && text.length > 5) {
        // Determine priority
        let priority: 'high' | 'medium' | 'low' = 'medium';
        const lowerText = text.toLowerCase();
        if (lowerText.includes('critical') || lowerText.includes('urgent') || lowerText.includes('blocking') || lowerText.includes('must')) {
          priority = 'high';
        } else if (lowerText.includes('nice to have') || lowerText.includes('optional') || lowerText.includes('consider')) {
          priority = 'low';
        }
        
        actionItems.push({ text, priority });
      }
    }
  }

  return actionItems;
}

async function fetchMRs() {
  console.log('Fetching merge requests...\n');

  try {
    // Fetch open MRs first (most important)
    const openMRs = await api.MergeRequests.all(projectId, {
      state: 'opened',
      perPage: 100,
      maxPages: 5,
    });

    // Fetch recently merged MRs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const mergedMRs = await api.MergeRequests.all(projectId, {
      state: 'merged',
      perPage: 100,
      maxPages: 3,
      updatedAfter: thirtyDaysAgo.toISOString(),
    });

    const mrs = [...openMRs, ...mergedMRs];

    console.log(`Found ${mrs.length} merge requests\n`);

    const allActionItems: ActionItem[] = [];

    // Process each MR
    for (const mr of mrs) {
      if (!mr.iid) continue;

      console.log(`Processing MR !${mr.iid}: ${mr.title}`);

      try {
        // Fetch MR notes (comments)
        const notes = await api.MergeRequestNotes.all(projectId, mr.iid, {
          perPage: 100,
        });

        // Fetch MR discussions (threaded comments)
        let discussions: any[] = [];
        try {
          discussions = await api.MergeRequestDiscussions.all(projectId, mr.iid, {
            perPage: 100,
          });
        } catch (err) {
          // Discussions might not be available
        }

        // Extract action items from notes
        for (const note of notes) {
          if (!note.body || note.system) continue; // Skip system notes
          
          const actionItems = extractActionItems(note.body);
          for (const item of actionItems) {
            allActionItems.push({
              mr: {
                id: mr.id,
                iid: mr.iid,
                title: mr.title || 'Untitled',
                state: mr.state || 'unknown',
                web_url: mr.web_url || '',
                author: {
                  name: (mr.author as any)?.name || 'Unknown',
                  username: (mr.author as any)?.username || 'unknown',
                },
                created_at: mr.created_at || '',
                updated_at: mr.updated_at || '',
              },
              comment: {
                id: note.id,
                body: note.body,
                author: {
                  name: (note.author as any)?.name || 'Unknown',
                  username: (note.author as any)?.username || 'unknown',
                },
                created_at: note.created_at || '',
                updated_at: note.updated_at || '',
              },
              actionItem: item.text,
              priority: item.priority,
            });
          }
        }

        // Extract action items from discussions
        for (const discussion of discussions) {
          for (const note of discussion.notes || []) {
            if (!note.body || note.system) continue;
            
            const actionItems = extractActionItems(note.body);
            for (const item of actionItems) {
              allActionItems.push({
                mr: {
                  id: mr.id,
                  iid: mr.iid,
                  title: mr.title || 'Untitled',
                  state: mr.state || 'unknown',
                  web_url: mr.web_url || '',
                  author: {
                    name: (mr.author as any)?.name || 'Unknown',
                    username: (mr.author as any)?.username || 'unknown',
                  },
                  created_at: mr.created_at || '',
                  updated_at: mr.updated_at || '',
                },
                comment: {
                  id: note.id,
                  body: note.body,
                  author: {
                    name: (note.author as any)?.name || 'Unknown',
                    username: (note.author as any)?.username || 'unknown',
                  },
                  created_at: note.created_at || '',
                  updated_at: note.updated_at || '',
                },
                actionItem: item.text,
                priority: item.priority,
              });
            }
          }
        }

        if (notes.length > 0 || discussions.length > 0) {
          console.log(`  Found ${notes.length} notes, ${discussions.length} discussions`);
        }
      } catch (err: any) {
        console.error(`  Error processing MR !${mr.iid}: ${err.message}`);
      }
    }

    // Group by priority
    const highPriority = allActionItems.filter(item => item.priority === 'high');
    const mediumPriority = allActionItems.filter(item => item.priority === 'medium');
    const lowPriority = allActionItems.filter(item => item.priority === 'low');

    // Output results
    console.log('\n' + '='.repeat(80));
    console.log('ACTION ITEMS AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTotal Action Items Found: ${allActionItems.length}`);
    console.log(`  High Priority: ${highPriority.length}`);
    console.log(`  Medium Priority: ${mediumPriority.length}`);
    console.log(`  Low Priority: ${lowPriority.length}`);

    // Group by MR
    const byMR = new Map<number, ActionItem[]>();
    for (const item of allActionItems) {
      const existing = byMR.get(item.mr.iid) || [];
      existing.push(item);
      byMR.set(item.mr.iid, existing);
    }

    console.log('\n' + '='.repeat(80));
    console.log('ACTION ITEMS BY MERGE REQUEST');
    console.log('='.repeat(80));

    // Sort by MR number (newest first)
    const sortedMRs = Array.from(byMR.entries()).sort((a, b) => b[0] - a[0]);

    for (const [mriid, items] of sortedMRs) {
      const mr = items[0].mr;
      console.log(`\nMR !${mriid}: ${mr.title}`);
      console.log(`  State: ${mr.state}`);
      console.log(`  URL: ${mr.web_url}`);
      console.log(`  Author: ${mr.author.name} (@${mr.author.username})`);
      console.log(`  Created: ${new Date(mr.created_at).toLocaleDateString()}`);
      console.log(`  Action Items: ${items.length}`);

      // Group by priority
      const high = items.filter(i => i.priority === 'high');
      const medium = items.filter(i => i.priority === 'medium');
      const low = items.filter(i => i.priority === 'low');

      if (high.length > 0) {
        console.log(`\n  HIGH PRIORITY (${high.length}):`);
        for (const item of high) {
          console.log(`    - ${item.actionItem}`);
          console.log(`      Comment by: ${item.comment.author.name} (@${item.comment.author.username})`);
          console.log(`      Date: ${new Date(item.comment.created_at).toLocaleDateString()}`);
        }
      }

      if (medium.length > 0) {
        console.log(`\n  MEDIUM PRIORITY (${medium.length}):`);
        for (const item of medium) {
          console.log(`    - ${item.actionItem}`);
          console.log(`      Comment by: ${item.comment.author.name} (@${item.comment.author.username})`);
        }
      }

      if (low.length > 0) {
        console.log(`\n  LOW PRIORITY (${low.length}):`);
        for (const item of low) {
          console.log(`    - ${item.actionItem}`);
          console.log(`      Comment by: ${item.comment.author.name} (@${item.comment.author.username})`);
        }
      }
    }

    // Summary by priority
    console.log('\n' + '='.repeat(80));
    console.log('HIGH PRIORITY ACTION ITEMS');
    console.log('='.repeat(80));
    for (const item of highPriority) {
      console.log(`\nMR !${item.mr.iid}: ${item.mr.title}`);
      console.log(`  ${item.actionItem}`);
      console.log(`  URL: ${item.mr.web_url}`);
      console.log(`  Comment by: ${item.comment.author.name} (@${item.comment.author.username})`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('AUDIT COMPLETE');
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('ERROR:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.statusText);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

fetchMRs().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
