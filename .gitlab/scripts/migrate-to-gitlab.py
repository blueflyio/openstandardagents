#!/usr/bin/env python3
"""
Migrate OSSA documentation to GitLab
Creates labels, milestones, and wiki pages via GitLab API
"""

import json
import os
import subprocess
import sys
import urllib.parse
from pathlib import Path

GITLAB_URL = "https://gitlab.bluefly.io"
PROJECT_PATH = "llm/openapi-ai-agents-standard"

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
    except Exception as e:
        print(f"Error getting token: {e}")
    return os.environ.get("GITLAB_TOKEN", "")

def get_project_id(token):
    """Get project ID from GitLab API"""
    import urllib.request
    import urllib.error
    
    url = f"{GITLAB_URL}/api/v4/projects/{urllib.parse.quote(PROJECT_PATH, safe='')}"
    req = urllib.request.Request(url)
    req.add_header("PRIVATE-TOKEN", token)
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            return data["id"]
    except Exception as e:
        print(f"Error getting project ID: {e}")
        return None

def create_label(token, project_id, name, color, description=""):
    """Create a GitLab label"""
    import urllib.request
    import urllib.error
    
    url = f"{GITLAB_URL}/api/v4/projects/{project_id}/labels"
    data = {
        "name": name,
        "color": color,
        "description": description
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode())
    req.add_header("PRIVATE-TOKEN", token)
    req.add_header("Content-Type", "application/json")
    req.get_method = lambda: "POST"
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            print(f"  ✓ Created label: {name}")
            return True
    except urllib.error.HTTPError as e:
        if e.code == 400:
            error_data = json.loads(e.read().decode())
            if "already been taken" in str(error_data):
                print(f"  ⊙ Label already exists: {name}")
                return True
        print(f"  ✗ Failed to create label {name}: {e.code}")
        return False
    except Exception as e:
        print(f"  ✗ Error creating label {name}: {e}")
        return False

def create_milestone(token, project_id, title, description):
    """Create a GitLab milestone"""
    import urllib.request
    import urllib.error
    
    url = f"{GITLAB_URL}/api/v4/projects/{project_id}/milestones"
    data = {
        "title": title,
        "description": description
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode())
    req.add_header("PRIVATE-TOKEN", token)
    req.add_header("Content-Type", "application/json")
    req.get_method = lambda: "POST"
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            print(f"  ✓ Created milestone: {title}")
            return True
    except urllib.error.HTTPError as e:
        if e.code == 400:
            error_data = json.loads(e.read().decode())
            if "already been taken" in str(error_data):
                print(f"  ⊙ Milestone already exists: {title}")
                return True
        print(f"  ✗ Failed to create milestone {title}: {e.code}")
        return False
    except Exception as e:
        print(f"  ✗ Error creating milestone {title}: {e}")
        return False

def create_wiki_page(token, project_id, title, content):
    """Create a GitLab wiki page"""
    import urllib.request
    import urllib.error
    
    url = f"{GITLAB_URL}/api/v4/projects/{project_id}/wikis"
    data = {
        "title": title,
        "content": content
    }
    
    req = urllib.request.Request(url, data=json.dumps(data).encode())
    req.add_header("PRIVATE-TOKEN", token)
    req.add_header("Content-Type", "application/json")
    req.get_method = lambda: "POST"
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            print(f"  ✓ Created wiki page: {title}")
            return True
    except urllib.error.HTTPError as e:
        if e.code == 400:
            error_data = json.loads(e.read().decode())
            if "already exists" in str(error_data):
                print(f"  ⊙ Wiki page already exists: {title}")
                return True
        print(f"  ✗ Failed to create wiki page {title}: {e.code}")
        if e.code != 400:
            print(f"    Response: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"  ✗ Error creating wiki page {title}: {e}")
        return False

def main():
    print("🚀 Starting GitLab Migration...")
    print("")
    
    # Get token and project ID
    token = get_gitlab_token()
    if not token:
        print("❌ Error: GITLAB_TOKEN not found")
        sys.exit(1)
    
    print(f"✓ Found GitLab token: {token[:10]}...")
    
    project_id = get_project_id(token)
    if not project_id:
        print("❌ Error: Could not get project ID")
        sys.exit(1)
    
    print(f"✓ Project ID: {project_id}")
    print("")
    
    # Create labels
    print("📋 Creating labels...")
    labels = [
        # Component labels
        ("component:spec", "#428BCA", "Component: Specification changes"),
        ("component:cli", "#5CB85C", "Component: CLI tooling"),
        ("component:examples", "#5BC0DE", "Component: Example improvements"),
        ("component:docs", "#337AB7", "Component: Documentation"),
        ("component:validation", "#31B0D5", "Component: Validation service"),
        ("component:migration", "#46B8DA", "Component: Migration tooling"),
        ("component:types", "#5F9EA0", "Component: TypeScript types"),
        ("component:build", "#2E86AB", "Component: Build system"),
        # Type labels
        ("type:bug", "#D9534F", "Issue type: Bug reports"),
        ("type:feature", "#5CB85C", "Issue type: New features"),
        ("type:enhancement", "#5BC0DE", "Issue type: Improvements"),
        ("type:documentation", "#337AB7", "Issue type: Documentation updates"),
        ("type:question", "#F0AD4E", "Issue type: Questions"),
        ("type:discussion", "#9E9E9E", "Issue type: Discussion"),
        # Priority labels
        ("priority:p0", "#D9534F", "Priority: Critical"),
        ("priority:p1", "#F0AD4E", "Priority: High"),
        ("priority:p2", "#FFC107", "Priority: Medium"),
        ("priority:p3", "#5BC0DE", "Priority: Low"),
        # Status labels
        ("status:needs-triage", "#999999", "Status: Needs triage"),
        ("status:needs-info", "#9E9E9E", "Status: Needs info"),
        ("status:in-progress", "#9C27B0", "Status: In progress"),
        ("status:blocked", "#D32F2F", "Status: Blocked"),
        ("status:ready-for-review", "#4CAF50", "Status: Ready for review"),
        # Audience labels
        ("audience:students", "#9C27B0", "Target audience: Students & Researchers"),
        ("audience:developers", "#009688", "Target audience: Developers"),
        ("audience:architects", "#673AB7", "Target audience: Architects"),
        ("audience:enterprises", "#607D8B", "Target audience: Enterprises"),
    ]
    
    created = 0
    for name, color, desc in labels:
        if create_label(token, project_id, name, color, desc):
            created += 1
    
    print(f"\n✓ Created/verified {created}/{len(labels)} labels")
    print("")
    
    # Create milestones
    print("🎯 Creating milestones...")
    milestones_dir = Path(__file__).parent.parent / "milestones"
    
    milestone_files = [
        ("v0.2.3-Documentation-Examples.md", "v0.2.3 - Documentation & Examples Release"),
        ("v0.3.0-Gamma.md", "v0.3.0 - Gamma Release"),
        ("v1.0.0-Genesis.md", "v1.0.0 - Genesis Release"),
    ]
    
    for filename, title in milestone_files:
        filepath = milestones_dir / filename
        if filepath.exists():
            content = filepath.read_text()
            # Extract description (first paragraph or overview section)
            description = content.split("## Overview")[1].split("\n\n")[1] if "## Overview" in content else content[:500]
            create_milestone(token, project_id, title, description)
    
    print("")
    
    # Create wiki pages
    print("📚 Creating wiki pages...")
    wiki_dir = Path(__file__).parent.parent / "wiki-content"
    
    # Home page
    home_file = wiki_dir / "00-HOME.md"
    if home_file.exists():
        content = home_file.read_text()
        create_wiki_page(token, project_id, "Home", content)
    
    # Getting Started pages
    getting_started_dir = wiki_dir / "Getting-Started"
    if getting_started_dir.exists():
        for file in getting_started_dir.glob("*.md"):
            title = f"Getting-Started/{file.stem}"
            content = file.read_text()
            create_wiki_page(token, project_id, title, content)
    
    # For Audiences pages
    audiences_dir = wiki_dir / "For-Audiences"
    if audiences_dir.exists():
        for file in audiences_dir.glob("*.md"):
            title = f"For-Audiences/{file.stem}"
            content = file.read_text()
            create_wiki_page(token, project_id, title, content)
    
    # Examples pages
    examples_dir = wiki_dir / "Examples"
    if examples_dir.exists():
        for file in examples_dir.glob("*.md"):
            title = f"Examples/{file.stem}"
            content = file.read_text()
            create_wiki_page(token, project_id, title, content)
    
    print("")
    print("✅ GitLab migration complete!")
    print("")
    print("Next steps:")
    print("1. Review wiki pages at: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/wikis")
    print("2. Review milestones at: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/milestones")
    print("3. Review labels at: https://gitlab.bluefly.io/llm/openapi-ai-agents-standard/-/labels")

if __name__ == "__main__":
    main()

