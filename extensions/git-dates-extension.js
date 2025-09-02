// extensions/git-dates-extension.js
const { execSync } = require('child_process');
const path = require('path');

function tryExec(cmd, cwd) {
  try { return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim(); }
  catch { return ''; }
}

function findRepoRoot(startDir) {
  const fs = require('fs');
  let dir = startDir;
  for (let i = 0; i < 20; i++) {
    if (!dir || dir === path.dirname(dir)) break;
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const top = tryExec('git rev-parse --show-toplevel', dir);
    if (top) return top;
    dir = path.dirname(dir);
  }
  return '';
}

module.exports.register = function () {
  this.on('documentsConverted', ({ playbook, contentCatalog }) => {
    const pages = contentCatalog.getPages();
    
    pages.forEach(page => {
      try {
        const abs = page.src?.abspath;
        if (!abs) return;

        const fromOrigin = page.src?.origin?.worktree || '';
        let repoRoot = '';
        if (fromOrigin) {
          const inside = tryExec('git rev-parse --is-inside-work-tree', fromOrigin) === 'true';
          repoRoot = inside ? (tryExec('git rev-parse --show-toplevel', fromOrigin) || fromOrigin) : '';
        }
        if (!repoRoot) repoRoot = findRepoRoot(path.dirname(abs));
        if (!repoRoot) return;

        let rel = path.relative(repoRoot, abs).split(path.sep).join('/');

        const last = tryExec(`git log -1 --follow --date=format:'%-d %B %Y' --format=%ad -- "${rel}"`, repoRoot);
        let first = tryExec(`git log --follow --diff-filter=A -1 --date=format:'%-d %B %Y' --format=%ad -- "${rel}"`, repoRoot);
        if (!first) {
          const oldest = tryExec(`git log --follow --reverse --date=format:'%-d %B %Y' --format=%ad -- "${rel}"`, repoRoot);
          first = oldest.split(/\r?\n/)[0] || '';
        }

        page.asciidoc = page.asciidoc || {};
        page.asciidoc.attributes = page.asciidoc.attributes || {};
        
        if (first) page.asciidoc.attributes['page-first_commit_date'] = first;
        if (last)  page.asciidoc.attributes['page-last_commit_date']  = last;
      } catch (e) {
        console.warn(`⚠️ git-dates: ${page.src?.path} → ${e.message}`);
      }
    });
  });
};
