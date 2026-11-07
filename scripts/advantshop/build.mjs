#!/usr/bin/env node
// Builds the standalone bundle of this fork and the files that must ship next to it.
//
//   node scripts/advantshop/build.mjs [target-dir]
//
// Writes into bundles/:
//   redoc.standalone.js      - minified, with a note that this build is modified (Apache-2.0 §4b)
//   LICENSE                  - Redoc's MIT license
//   THIRD-PARTY-NOTICES.txt  - license texts of the third-party packages inlined into the bundle
// With target-dir, also copies these three files there.

import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const BUNDLES = join(ROOT, 'bundles');
const BUNDLE = join(BUNDLES, 'redoc.standalone.js');
// written by the `bundled-licenses` plugin of vite.config.ts on every build
const BUNDLED_PACKAGES = join(ROOT, 'node_modules/.cache/bundled-licenses/redoc.standalone.json');
const FILES = ['redoc.standalone.js', 'LICENSE', 'THIRD-PARTY-NOTICES.txt'];

function run(command) {
  execSync(command, { cwd: ROOT, stdio: 'inherit' });
}

function git(args) {
  return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function buildStamp() {
  const commit = git('rev-parse --short HEAD');
  const dirty = git('status --porcelain --untracked-files=no') !== '';
  const branch = git('rev-parse --abbrev-ref HEAD');
  return `${branch}@${commit}${dirty ? '+uncommitted' : ''}`;
}

const MODIFIED_NOTE = (stamp) => `/*!
 * Modified build of Redoc by AdvantShop: https://github.com/itm-dev/redoc (${stamp}).
 * Adds options for the AdvantShop admin; see ADVANTSHOP.md in the fork.
 */
`;

function packageDirs(dir, result = []) {
  if (!existsSync(dir)) return result;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.bin' || entry.name === '.cache') continue;
    const path = join(dir, entry.name);
    if (entry.name.startsWith('@')) {
      packageDirs(path, result);
      continue;
    }
    result.push(path);
    packageDirs(join(path, 'node_modules'), result);
  }
  return result;
}

function findPackageDir(dirs, name, version) {
  return dirs.find((dir) => {
    const manifest = join(dir, 'package.json');
    if (!existsSync(manifest)) return false;
    const { name: n, version: v } = JSON.parse(readFileSync(manifest, 'utf8'));
    return n === name && v === version;
  });
}

function licenseText(dir) {
  if (!dir) return undefined;
  const file = readdirSync(dir).find((entry) => /^(licen[cs]e|copying)/i.test(entry));
  return file ? readFileSync(join(dir, file), 'utf8').trim() : undefined;
}

function writeNotices() {
  const packages = JSON.parse(readFileSync(BUNDLED_PACKAGES, 'utf8'));
  const dirs = packageDirs(join(ROOT, 'node_modules'));
  const sections = packages.map(({ name, version, license, repository }) => {
    const text = licenseText(findPackageDir(dirs, name, version));
    if (!text) console.warn(`No license file found for ${name}@${version}`);
    return [
      `${name}@${version} - ${license}`,
      repository ? `Source: ${repository}` : undefined,
      '',
      text ?? `The package ships no license file; it is distributed under ${license}.`,
    ]
      .filter((line) => line !== undefined)
      .join('\n');
  });
  const header =
    'Third-party software inlined into redoc.standalone.js.\n' +
    'Redoc itself is distributed under the MIT license, see LICENSE.';
  const separator = `\n\n${'='.repeat(78)}\n\n`;
  writeFileSync(
    join(BUNDLES, 'THIRD-PARTY-NOTICES.txt'),
    `${header}${separator}${sections.join(separator)}\n`,
  );
  console.log(`THIRD-PARTY-NOTICES.txt: ${packages.length} packages`);
}

run('npm run build:standalone');
run('npm run minify');

writeFileSync(BUNDLE, MODIFIED_NOTE(buildStamp()) + readFileSync(BUNDLE, 'utf8'));
copyFileSync(join(ROOT, 'LICENSE'), join(BUNDLES, 'LICENSE'));
writeNotices();

const target = process.argv[2];
if (target) {
  for (const file of FILES) copyFileSync(join(BUNDLES, file), join(resolve(target), file));
  console.log(`Copied ${FILES.join(', ')} to ${resolve(target)}`);
}
