#!/usr/bin/env node
/**
 * Download images from a Linear issue
 * Usage: node issue-images.js <issue-id> [--output-dir <path>] [--list-only]
 *
 * Extracts images from:
 * - Formal attachments (issue.attachments)
 * - Inline markdown images in issue description
 *
 * Requires OAuth authentication (run auth-login.js) or LINEAR_API_KEY environment variable
 */

import { LinearClient } from '@linear/sdk';
import { getAccessToken } from './lib/token-store.js';
import fs from 'fs/promises';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const issueId = args.find(arg => !arg.startsWith('--'));
const listOnly = args.includes('--list-only');
const outputDirIndex = args.indexOf('--output-dir');
const outputDir = outputDirIndex !== -1 ? args[outputDirIndex + 1] : './linear-images';

if (!issueId) {
  console.error(JSON.stringify({ error: 'Usage: node issue-images.js <issue-id> [--output-dir <path>] [--list-only]' }));
  process.exit(1);
}

let apiKey;
try {
  apiKey = await getAccessToken();
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}

const client = new LinearClient({ apiKey });

/**
 * Extract image URLs from markdown text
 */
function extractInlineImages(markdown) {
  if (!markdown) return [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const url = match[2];
    // Only include URLs that look like images
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i) || url.includes('uploads.linear.app')) {
      images.push({
        type: 'inline',
        url: url,
        alt: match[1] || null
      });
    }
  }
  return images;
}

/**
 * Get filename from URL
 */
function getFilenameFromUrl(url, index, issueIdentifier) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const basename = path.basename(pathname);
    // If basename has a valid extension, use it
    if (basename.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
      return `${issueIdentifier}-${index}-${basename}`;
    }
    // Default to .png
    return `${issueIdentifier}-${index}-image.png`;
  } catch {
    return `${issueIdentifier}-${index}-image.png`;
  }
}

/**
 * Download a single image
 */
async function downloadImage(url, filepath, token) {
  const headers = {};
  // Add auth header for Linear uploads (API key without Bearer prefix)
  if (url.includes('linear.app') || url.includes('uploads.linear.app')) {
    headers['Authorization'] = token;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filepath, buffer);
  return buffer.length;
}

async function main() {
  try {
    // Fetch the issue
    const issue = await client.issue(issueId);
    if (!issue) {
      throw new Error(`Issue not found: ${issueId}`);
    }

    const issueIdentifier = issue.identifier;
    const images = [];

    // Get formal attachments
    const attachments = await issue.attachments();
    const attachmentNodes = await attachments.nodes;
    for (const attachment of attachmentNodes) {
      // Check if it's an image attachment
      const url = attachment.url;
      if (url && (url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i) || url.includes('uploads.linear.app'))) {
        images.push({
          type: 'attachment',
          url: url,
          title: attachment.title || null
        });
      }
    }

    // Get inline images from description
    const inlineImages = extractInlineImages(issue.description);
    images.push(...inlineImages);

    // If list-only, just output the URLs
    if (listOnly) {
      console.log(JSON.stringify({
        issueId: issueIdentifier,
        issueTitle: issue.title,
        images: images
      }, null, 2));
      return;
    }

    // Download images
    await fs.mkdir(outputDir, { recursive: true });

    const downloaded = [];
    const failed = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = getFilenameFromUrl(image.url, i + 1, issueIdentifier);
      const filepath = path.join(outputDir, filename);

      try {
        const size = await downloadImage(image.url, filepath, apiKey);
        downloaded.push({
          type: image.type,
          url: image.url,
          path: path.resolve(filepath),
          size: size
        });
      } catch (err) {
        failed.push({
          type: image.type,
          url: image.url,
          error: err.message
        });
      }
    }

    console.log(JSON.stringify({
      issueId: issueIdentifier,
      issueTitle: issue.title,
      outputDir: path.resolve(outputDir),
      downloaded: downloaded,
      failed: failed
    }, null, 2));

  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
