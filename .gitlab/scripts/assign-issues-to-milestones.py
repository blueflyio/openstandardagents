#!/usr/bin/env python3
"""
Assign issues to appropriate milestones based on labels and content
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

def get_milestones(token):
    """Get active milestones"""
    milestones = api_request("GET", "milestones?state=active", token)
    if "error" in milestones:
        return {}
    return {m["title"]: m["id"] for m in milestones}

def get_issues(token):
    """Get all open issues"""
    issues = api_request("GET", "issues?state=opened&per_page=100", token)
    if "error" in issues:
        return []
    return issues

def assign_issue_to_milestone(token, issue_id, milestone_id):
    """Assign issue to milestone"""
    return api_request("PUT", f"issues/{issue_id}", token, {"milestone_id": milestone_id})

def main():
    print("📋 Assigning issues to milestones...")
    print("")
    
    token = get_gitlab_token()
    
    # Get milestones
    milestones = get_milestones(token)
    print(f"Found {len(milestones)} active milestones:")
    for title, mid in milestones.items():
        print(f"  - {title} (ID: {mid})")
    print("")
    
    # Get issues
    issues = get_issues(token)
    print(f"Found {len(issues)} open issues")
    print("")
    
    if not issues:
        print("No issues to assign")
        return
    
    # Milestone mapping based on issue content/labels
    milestone_keywords = {
        "v0.2.3 - Documentation & Examples Release": [
            "docs", "documentation", "wiki", "example", "migration", "guide"
        ],
        "v0.3.0 - Gamma Release": [
            "production", "enterprise", "compliance", "observability", "performance"
        ],
        "v1.0.0 - Genesis Release": [
            "breaking", "spec", "specification", "ecosystem", "stable"
        ]
    }
    
    assigned = 0
    
    for issue in issues:
        issue_id = issue["iid"]
        title = issue["title"].lower()
        description = issue.get("description", "").lower()
        labels = []
        for label in issue.get("labels", []):
            if isinstance(label, dict):
                labels.append(label.get("name", ""))
            else:
                labels.append(str(label))
        current_milestone = issue.get("milestone")
        
        if current_milestone:
            print(f"  ⊙ Issue #{issue_id}: {issue['title'][:50]}... (already has milestone: {current_milestone['title']})")
            continue
        
        # Try to match issue to milestone
        matched_milestone = None
        for milestone_title, keywords in milestone_keywords.items():
            if milestone_title not in milestones:
                continue
            
            # Check title and description for keywords
            text = f"{title} {description} {' '.join(labels)}"
            if any(keyword in text for keyword in keywords):
                matched_milestone = milestone_title
                break
        
        # Default to v0.2.3 if it's documentation-related
        if not matched_milestone and ("docs" in labels or "documentation" in labels):
            matched_milestone = "v0.2.3 - Documentation & Examples Release"
        
        if matched_milestone and matched_milestone in milestones:
            milestone_id = milestones[matched_milestone]
            result = assign_issue_to_milestone(token, issue_id, milestone_id)
            if "error" not in result:
                assigned += 1
                print(f"  ✓ Assigned issue #{issue_id} to {matched_milestone}")
            else:
                print(f"  ✗ Failed to assign issue #{issue_id}: {result.get('error', 'Unknown error')}")
        else:
            print(f"  ? Issue #{issue_id}: {issue['title'][:50]}... (no clear milestone match)")
    
    print("")
    print(f"✅ Assigned {assigned} issues to milestones")
    print("")
    print("Review issues: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/issues")

if __name__ == "__main__":
    main()

