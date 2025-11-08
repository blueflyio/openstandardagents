#!/usr/bin/env python3
"""
Reassign issues from closed milestones to active ones
"""

import json
import subprocess
import sys
import urllib.parse
import urllib.request

GITLAB_URL = "https://gitlab.bluefly.io"
PROJECT_ID = 1553

def get_gitlab_token():
    """Extract GitLab token from git remote"""
    try:
        result = subprocess.run(
            ["git", "remote", "get-url", "origin"],
            capture_output=True,
            text=True,
            check=True
        )
        remote_url = result.stdout.strip()
        if "glpat-" in remote_url:
            token = remote_url.split("glpat-")[1].split("@")[0]
            return f"glpat-{token}"
    except Exception:
        pass
    return "glpat-idKbvfiXqUbE5j6jj5xc"

def api_request(method, endpoint, token, data=None):
    """Make GitLab API request"""
    url = f"{GITLAB_URL}/api/v4/projects/{PROJECT_ID}/{endpoint}"
    req = urllib.request.Request(url)
    req.add_header("PRIVATE-TOKEN", token)
    
    if data:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(data).encode()
    
    req.get_method = lambda: method
    
    try:
        with urllib.request.urlopen(req) as response:
            content = response.read()
            if content:
                return json.loads(content)
            return {}
    except urllib.error.HTTPError as e:
        error_data = e.read().decode()
        try:
            return {"error": json.loads(error_data), "code": e.code}
        except:
            return {"error": error_data, "code": e.code}

def main():
    print("🔄 Reassigning issues from closed milestones...")
    print("")
    
    token = get_gitlab_token()
    
    # Get active milestones
    active_milestones = api_request("GET", "milestones?state=active", token)
    if "error" in active_milestones:
        print(f"Error: {active_milestones['error']}")
        sys.exit(1)
    
    # Find v0.2.3 milestone (target for reassignment)
    target_milestone_id = None
    for m in active_milestones:
        if "v0.2.3" in m["title"]:
            target_milestone_id = m["id"]
            print(f"Target milestone: {m['title']} (ID: {target_milestone_id})")
            break
    
    if not target_milestone_id:
        print("Error: Could not find v0.2.3 milestone")
        sys.exit(1)
    
    # Get all issues
    issues = api_request("GET", "issues?state=opened&per_page=100", token)
    if "error" in issues:
        print(f"Error: {issues['error']}")
        sys.exit(1)
    
    print(f"Found {len(issues)} open issues")
    print("")
    
    reassigned = 0
    
    for issue in issues:
        milestone = issue.get("milestone")
        if not milestone:
            continue
        
        milestone_title = milestone.get("title", "")
        milestone_state = milestone.get("state", "")
        
        # Reassign issues from closed milestones to v0.2.3
        if milestone_state == "closed" or "v0.2.x" in milestone_title:
            issue_id = issue["iid"]
            result = api_request("PUT", f"issues/{issue_id}", token, {"milestone_id": target_milestone_id})
            if "error" not in result:
                reassigned += 1
                print(f"  ✓ Reassigned issue #{issue_id} from '{milestone_title}' to v0.2.3")
            else:
                print(f"  ✗ Failed to reassign issue #{issue_id}: {result.get('error', 'Unknown error')}")
    
    print("")
    print(f"✅ Reassigned {reassigned} issues to v0.2.3 milestone")
    print("")
    print("View milestones: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/milestones")

if __name__ == "__main__":
    main()

