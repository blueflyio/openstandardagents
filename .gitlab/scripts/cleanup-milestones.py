#!/usr/bin/env python3
"""
Clean up GitLab milestones - remove duplicates and outdated ones
Keep only: v0.2.3, v0.3.0, v1.0.0 (without "release:" prefix)
Close outdated: v0.1.0, v0.1.2, v0.1.3, v0.1.4
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
            return json.loads(response.read())
    except urllib.error.HTTPError as e:
        error_data = e.read().decode()
        try:
            return {"error": json.loads(error_data)}
        except:
            return {"error": error_data, "code": e.code}

def get_all_milestones(token):
    """Get all milestones"""
    return api_request("GET", "milestones?state=all", token)

def close_milestone(token, milestone_id):
    """Close a milestone"""
    return api_request("PUT", f"milestones/{milestone_id}", token, {"state_event": "close"})

def delete_milestone(token, milestone_id):
    """Delete a milestone"""
    url = f"{GITLAB_URL}/api/v4/projects/{PROJECT_ID}/milestones/{milestone_id}"
    req = urllib.request.Request(url)
    req.add_header("PRIVATE-TOKEN", token)
    req.get_method = lambda: "DELETE"
    
    try:
        with urllib.request.urlopen(req) as response:
            # DELETE returns 204 No Content, so empty response is success
            return {"success": True}
    except urllib.error.HTTPError as e:
        if e.code == 204:
            return {"success": True}
        error_data = e.read().decode()
        try:
            return {"error": json.loads(error_data), "code": e.code}
        except:
            return {"error": error_data, "code": e.code}

def main():
    print("🧹 Cleaning up GitLab milestones...")
    print("")
    
    token = get_gitlab_token()
    milestones = get_all_milestones(token)
    
    if "error" in milestones:
        print(f"❌ Error fetching milestones: {milestones['error']}")
        sys.exit(1)
    
    print(f"Found {len(milestones)} milestones")
    print("")
    
    # Milestones to keep (clean versions without "release:" prefix)
    keep_titles = [
        "v0.2.3 - Documentation & Examples Release",
        "v0.3.0 - Gamma Release",
        "v1.0.0 - Genesis Release"
    ]
    
    # Milestones to close (outdated Alpha)
    close_titles = [
        "release: v0.1.0 - Alpha - 2025-11-07",
        "release: v0.1.2 - Alpha - 2025-11-07",
        "release: v0.1.3 - Alpha - 2025-11-07",
        "release: v0.1.4 - Alpha - 2025-11-07"
    ]
    
    # Milestones to delete (duplicates with "release:" prefix)
    delete_titles = [
        "release: v0.3.0 - Gamma - 2025-11-07",
        "release: v1.0.0 - Genesis - 2025-11-07"
    ]
    
    # Also delete any milestone starting with "release:" that has a clean version
    for milestone in milestones:
        title = milestone["title"]
        if title.startswith("release:") and any(keep_title in title for keep_title in ["v0.2.3", "v0.3.0", "v1.0.0"]):
            if title not in delete_titles:
                delete_titles.append(title)
    
    kept = []
    closed = []
    deleted = []
    
    for milestone in milestones:
        title = milestone["title"]
        milestone_id = milestone["id"]
        state = milestone["state"]
        
        # Keep clean versions
        if title in keep_titles:
            kept.append((milestone_id, title, state))
            continue
        
        # Close outdated Alpha milestones
        if title in close_titles:
            if state == "active":
                result = close_milestone(token, milestone_id)
                if "error" not in result:
                    closed.append((milestone_id, title))
                    print(f"  ✓ Closed: {title}")
                else:
                    print(f"  ✗ Failed to close {title}: {result.get('error', 'Unknown error')}")
            else:
                print(f"  ⊙ Already closed: {title}")
        
        # Delete duplicate "release:" versions
        elif title in delete_titles:
            result = delete_milestone(token, milestone_id)
            if result.get("success") or "error" not in result:
                deleted.append((milestone_id, title))
                print(f"  ✓ Deleted: {title}")
            else:
                print(f"  ✗ Failed to delete {title}: {result.get('error', 'Unknown error')}")
        else:
            print(f"  ? Unknown milestone: {title} (ID: {milestone_id}, State: {state})")
    
    print("")
    print("=== Summary ===")
    print(f"✓ Kept: {len(kept)} milestones")
    for mid, title, state in kept:
        print(f"  - {title} (ID: {mid}, State: {state})")
    
    print(f"")
    print(f"✓ Closed: {len(closed)} outdated Alpha milestones")
    for mid, title in closed:
        print(f"  - {title}")
    
    print(f"")
    print(f"✓ Deleted: {len(deleted)} duplicate milestones")
    for mid, title in deleted:
        print(f"  - {title}")
    
    print("")
    print("✅ Milestone cleanup complete!")
    print("")
    print("View milestones: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/milestones")

if __name__ == "__main__":
    main()

