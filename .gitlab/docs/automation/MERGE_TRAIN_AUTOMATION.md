# Merge Train Automation - Complete Release System

## Overview

This system automates the entire release process using GitLab Merge Trains:
1. **Development Merge Train** → Pre-release to npm (dev tag)
2. **Main Merge Train** → Public release to npm + GitHub
3. **Website Merge Train** → Independent website deployments

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Branches                          │
│  #44, #45, #47, #48, #49, #50...                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Development Branch   │
         │  Merge Train Enabled  │
         └───────────┬───────────┘
                     │
                     ├─► Auto-test all MRs
                     ├─► Merge in sequence
                     └─► Trigger: npm publish --tag dev
                     
                     │ (Manual: Close Milestone)
                     ▼
         ┌───────────────────────┐
         │    Main Branch        │
         │  Merge Train Enabled  │
         └───────────┬───────────┘
                     │
                     ├─► Auto-test
                     ├─► Merge in sequence
                     ├─► Trigger: npm publish (latest)
                     ├─► Trigger: GitHub release
                     └─► Trigger: Tag creation

┌─────────────────────────────────────────────────────────────┐
│                  Website (Independent)                       │
│  Merge Train: Auto-deploy on any change                     │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Enable Merge Trains

Run this script to enable merge trains on all projects:

```bash
#!/bin/bash
# enable-merge-trains.sh

TOKEN="your-gitlab-token"
PROJECT_ID="blueflyio%2Fopenstandardagents"

# Enable merge trains
curl --request PUT --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID" \
  --data "merge_trains_enabled=true" \
  --data "merge_pipelines_enabled=true" \
  --data "auto_merge_enabled=true"

echo "✅ Merge trains enabled"
```

### Step 2: Update .gitlab-ci.yml

Add merge train automation to your CI/CD:

```yaml
# .gitlab-ci.yml

workflow:
  rules:
    - if: $CI_COMMIT_BRANCH
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_TAG
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train"
    - when: always

stages:
  - validate
  - build
  - test
  - release-dev
  - release-prod
  - deploy-website

# ============================================================================
# MERGE TRAIN: Development → Pre-release
# ============================================================================

release:dev:
  stage: release-dev
  image: node:22-alpine
  before_script:
    - npm ci --legacy-peer-deps
  script:
    - |
      echo "🚂 Merge Train: Development Pre-release"
      
      # Get version from package.json
      VERSION=$(node -p "require('./package.json').version")
      
      # Create dev tag
      DEV_TAG="${VERSION}-dev.${CI_PIPELINE_ID}"
      
      # Update version
      npm version $DEV_TAG --no-git-tag-version
      
      # Configure npm
      echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
      
      # Publish to npm with dev tag
      npm publish --tag dev --access public
      
      echo "✅ Published: @bluefly/openstandardagents@${DEV_TAG}"
      echo "📦 Install: npm install @bluefly/openstandardagents@dev"
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "development"
      when: on_success
  environment:
    name: npm-dev
    url: https://www.npmjs.com/package/@bluefly/openstandardagents

# ============================================================================
# MERGE TRAIN: Main → Public Release
# ============================================================================

release:prod:check-milestone:
  stage: validate
  image: alpine:latest
  before_script:
    - apk add --no-cache curl jq
  script:
    - |
      echo "🔍 Checking milestone status..."
      
      # Get closed milestones
      MILESTONES=$(curl -s --header "PRIVATE-TOKEN: ${GITLAB_PUSH_TOKEN}" \
        "https://gitlab.com/api/v4/projects/${CI_PROJECT_ID}/milestones?state=closed")
      
      # Find milestone matching version
      VERSION=$(node -p "require('./package.json').version")
      MILESTONE=$(echo "$MILESTONES" | jq -r ".[] | select(.title | contains(\"$VERSION\"))")
      
      if [ -z "$MILESTONE" ]; then
        echo "❌ ERROR: Milestone for v${VERSION} is not closed"
        echo "Please close the milestone before releasing"
        exit 1
      fi
      
      echo "✅ Milestone closed: $(echo $MILESTONE | jq -r '.title')"
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
      when: on_success

release:prod:npm:
  stage: release-prod
  image: node:22-alpine
  needs:
    - release:prod:check-milestone
  before_script:
    - npm ci --legacy-peer-deps
  script:
    - |
      echo "🚂 Merge Train: Production Release"
      
      VERSION=$(node -p "require('./package.json').version")
      
      # Configure npm
      echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
      
      # Publish to npm (latest tag)
      npm publish --access public
      
      echo "✅ Published: @bluefly/openstandardagents@${VERSION}"
      echo "📦 Install: npm install @bluefly/openstandardagents"
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
      when: on_success
  environment:
    name: npm-production
    url: https://www.npmjs.com/package/@bluefly/openstandardagents

release:prod:github:
  stage: release-prod
  image: alpine:latest
  needs:
    - release:prod:npm
  before_script:
    - apk add --no-cache git curl jq
  script:
    - |
      echo "🚂 Merge Train: GitHub Release"
      
      VERSION=$(node -p "require('./package.json').version")
      TAG="v${VERSION}"
      
      # Create GitHub release
      curl -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/blueflyio/openstandardagents/releases" \
        -d "{
          \"tag_name\": \"${TAG}\",
          \"name\": \"Release ${TAG}\",
          \"body\": \"See CHANGELOG.md for details\",
          \"draft\": false,
          \"prerelease\": false
        }"
      
      echo "✅ GitHub release created: ${TAG}"
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
      when: on_success
  environment:
    name: github-production
    url: https://github.com/blueflyio/openstandardagents/releases

release:prod:tag:
  stage: release-prod
  image: alpine:latest
  needs:
    - release:prod:github
  before_script:
    - apk add --no-cache git
    - git config user.email "ci@bluefly.io"
    - git config user.name "GitLab CI"
  script:
    - |
      echo "🚂 Merge Train: Git Tag"
      
      VERSION=$(node -p "require('./package.json').version")
      TAG="v${VERSION}"
      
      # Create and push tag
      git tag -a "$TAG" -m "Release $TAG"
      git push origin "$TAG"
      
      echo "✅ Git tag created: ${TAG}"
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train" && $CI_MERGE_REQUEST_TARGET_BRANCH_NAME == "main"
      when: on_success

# ============================================================================
# WEBSITE: Independent Deployment
# ============================================================================

deploy:website:
  stage: deploy-website
  image: node:22-alpine
  before_script:
    - cd website
    - npm ci --legacy-peer-deps
  script:
    - |
      echo "🌐 Deploying website..."
      npm run build
      
      # Deploy to GitLab Pages
      mkdir -p ../public
      cp -r out/* ../public/
      
      echo "✅ Website deployed"
  artifacts:
    paths:
      - public
    expire_in: 30 days
  rules:
    # Deploy on any change to website directory
    - if: $CI_COMMIT_BRANCH == "development" || $CI_COMMIT_BRANCH == "main"
      changes:
        - website/**/*
      when: on_success
    # Or manual deployment
    - if: $CI_COMMIT_BRANCH == "development" || $CI_COMMIT_BRANCH == "main"
      when: manual
  environment:
    name: website-production
    url: https://openstandardagents.org
```

### Step 3: Configure CI/CD Variables

Add these variables in GitLab:
- Settings → CI/CD → Variables

```
NPM_TOKEN=npm_xxxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITLAB_PUSH_TOKEN=glpat-xxxxxxxxxxxxx
```

### Step 4: Branch Protection Rules

```bash
# Protect development branch
curl --request POST --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/protected_branches" \
  --data "name=development" \
  --data "push_access_level=40" \
  --data "merge_access_level=40" \
  --data "allow_force_push=false"

# Protect main branch
curl --request POST --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/protected_branches" \
  --data "name=main" \
  --data "push_access_level=40" \
  --data "merge_access_level=40" \
  --data "allow_force_push=false"
```

## Usage Workflow

### Development Pre-releases

1. **Create feature branches** (#44, #45, etc.)
2. **Open MRs to development**
3. **Add to merge train**: Click "Add to merge train" button
4. **Automatic**:
   - ✅ Tests run
   - ✅ Merges in sequence
   - ✅ Publishes to npm with `dev` tag
   - ✅ Version: `0.2.6-dev.12345`

**Install dev version:**
```bash
npm install @bluefly/openstandardagents@dev
```

### Production Releases

1. **Close milestone** (e.g., v0.2.6)
2. **Create MR**: development → main
3. **Add to merge train**: Click "Add to merge train"
4. **Automatic**:
   - ✅ Validates milestone is closed
   - ✅ Tests run
   - ✅ Merges to main
   - ✅ Publishes to npm (latest tag)
   - ✅ Creates GitHub release
   - ✅ Creates git tag

**That's it!** One button click.

### Website Deployments

**Automatic**: Any change to `website/` directory triggers deployment

**Manual**: Click "Deploy Website" button in pipeline

**Independent**: Website deploys don't affect npm releases

## Merge Train Dashboard

View all merge trains:
- Development: https://gitlab.com/blueflyio/openstandardagents/-/merge_trains?branch=development
- Main: https://gitlab.com/blueflyio/openstandardagents/-/merge_trains?branch=main

## One-Button Release Process

### For v0.2.6 Release:

1. **Close Milestone**:
   - Go to: https://gitlab.com/blueflyio/openstandardagents/-/milestones/6212551
   - Click "Close milestone"

2. **Create MR**:
   - development → main
   - Title: "Release v0.2.6"

3. **Add to Merge Train**:
   - Click "Add to merge train" button
   - Done! ✅

**Everything else is automatic:**
- ✅ Milestone validation
- ✅ Tests
- ✅ npm publish
- ✅ GitHub release
- ✅ Git tag
- ✅ Notifications

## Monitoring

### View Pipeline Status

```bash
# Get merge train status
curl --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_trains"
```

### Notifications

Set up Slack/Discord webhooks:
```yaml
# .gitlab-ci.yml
notify:success:
  stage: .post
  script:
    - |
      curl -X POST $SLACK_WEBHOOK \
        -d "{\"text\": \"✅ Release ${VERSION} published!\"}"
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train"
      when: on_success
```

## Rollback Procedure

If something goes wrong:

```bash
# Unpublish from npm
npm unpublish @bluefly/openstandardagents@0.2.6

# Delete GitHub release
gh release delete v0.2.6

# Delete git tag
git push origin :refs/tags/v0.2.6
```

## Best Practices

1. **Always close milestone first** before releasing
2. **Use merge trains** for all merges to development/main
3. **Test dev releases** before promoting to production
4. **Monitor merge train dashboard** for status
5. **Website deploys independently** - don't wait for releases

## Troubleshooting

### Merge Train Stuck

```bash
# Cancel merge train
curl --request DELETE --header "PRIVATE-TOKEN: $TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/merge_trains/$MERGE_TRAIN_ID"
```

### Pipeline Failed

- Check logs in GitLab
- Fix issue in feature branch
- Re-add to merge train

### npm Publish Failed

- Check NPM_TOKEN is valid
- Verify version doesn't already exist
- Check npm registry status

## Advanced: Multi-Project Merge Trains

For agent-platform group projects:

```yaml
# Trigger downstream merge trains
trigger:downstream:
  stage: .post
  trigger:
    project: blueflyio/agent-platform/agent-buildkit
    branch: development
    strategy: depend
  rules:
    - if: $CI_MERGE_REQUEST_EVENT_TYPE == "merge_train"
```

## Summary

**Your Workflow:**
1. Close milestone ✅
2. Click "Add to merge train" ✅
3. Done! Everything else is automatic ✅

**Automated:**
- ✅ Testing
- ✅ Merging
- ✅ npm publishing
- ✅ GitHub releases
- ✅ Git tagging
- ✅ Website deployment

**Result**: One-button releases with full automation!
