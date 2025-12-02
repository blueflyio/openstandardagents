#!/usr/bin/env node
const fs = require('fs');
const crypto = require('crypto');

const eslintResults = JSON.parse(fs.readFileSync(process.argv[2] || 'eslint-report.json', 'utf8'));

const codeQualityReport = [];

eslintResults.forEach(file => {
  file.messages.forEach(msg => {
    const fingerprint = crypto
      .createHash('md5')
      .update(`${file.filePath}:${msg.line}:${msg.ruleId}`)
      .digest('hex');

    codeQualityReport.push({
      description: msg.message,
      check_name: msg.ruleId || 'eslint',
      fingerprint,
      severity: msg.severity === 2 ? 'major' : 'minor',
      location: {
        path: file.filePath.replace(process.cwd() + '/', ''),
        lines: {
          begin: msg.line
        }
      }
    });
  });
});

fs.writeFileSync(
  process.argv[3] || 'gl-code-quality-report.json',
  JSON.stringify(codeQualityReport, null, 2)
);
