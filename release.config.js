export default {
  branches: [
    'main',
    { name: 'development', prerelease: 'dev', channel: 'development' },
  ],
  repositoryUrl: 'https://gitlab.bluefly.io/llm/openapi-ai-agents-standard.git',
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          { type: 'docs', scope: 'README', release: 'patch' },
          { type: 'refactor', scope: 'core-*', release: 'minor' },
          { type: 'refactor', release: 'patch' },
          { type: 'chore', scope: 'deps', release: 'patch' },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'angular',
        parserOpts: { noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'] },
        writerOpts: { commitsSort: ['subject', 'scope'] },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle:
          '# Changelog\n\nAll notable changes to OSSA (Open Standard for Scalable Agents) will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
      },
    ],
    [
      '@semantic-release/npm',
      { npmPublish: false, tarballDir: 'dist' },
    ],
    [
      '@semantic-release/gitlab',
      {
        gitlabUrl: 'https://gitlab.bluefly.io',
        assets: [
          { path: 'dist/*.tgz', label: 'OSSA npm package (${nextRelease.gitTag})' },
          {
            path: "spec/v${nextRelease.version.split('.')[0]}.${nextRelease.version.split('.')[1]}.${nextRelease.version.split('.')[2]}/ossa-${nextRelease.version.split('.')[0]}.${nextRelease.version.split('.')[1]}.${nextRelease.version.split('.')[2]}.schema.json",
            label: 'OSSA ${nextRelease.version} JSON Schema',
          },
        ],
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
