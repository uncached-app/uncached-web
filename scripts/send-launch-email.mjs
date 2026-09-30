/**
 * Emails the waitlist that the app is out, as a Brevo campaign so Brevo keeps
 * handling unsubscribes and delivery.
 *
 *   node --env-file=.env scripts/send-launch-email.mjs                    counts, writes a preview
 *   node --env-file=.env scripts/send-launch-email.mjs --test you@x.com   builds the campaign, sends one test
 *   node --env-file=.env scripts/send-launch-email.mjs --test you@x.com --campaign <id>
 *                                                                        tests a campaign built earlier
 *   node --env-file=.env scripts/send-launch-email.mjs --send <id>        sends that campaign to everyone
 *
 * Brevo only sends tests to contacts that sit in some list, so the test address
 * is kept in a list of its own and never joins the launch audience.
 *
 * Contacts whose OS attribute is Windows are left out: there is no Windows
 * build to download yet.
 *
 * Env: BREVO_API_KEY (required). BREVO_LIST_ID, BREVO_SENDER_EMAIL,
 * BREVO_SENDER_NAME and ADMIN_NOTIFICATION_EMAIL default to wrangler.jsonc.
 */
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const API = 'https://api.brevo.com/v3';
const PAGE = 500;
/** Brevo's cap on emails per add-to-list request. */
const ADD_BATCH = 150;

const config = {
  apiKey: process.env.BREVO_API_KEY ?? '',
  listId: Number(process.env.BREVO_LIST_ID ?? 3),
  sender: {
    name: process.env.BREVO_SENDER_NAME ?? 'Uncached',
    email: process.env.BREVO_SENDER_EMAIL ?? 'no-reply@uncached.app',
  },
  replyTo: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'hello@natanviana.dev',
};

const TESTER_LIST = 'Uncached testers';

const SUBJECT = 'Uncached is out';
const PREVIEW = 'Free for macOS and Linux. Your build folders, cleaned without losing work.';

async function brevo(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'api-key': config.apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function listContacts(listId) {
  const contacts = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await brevo('GET', `/contacts/lists/${listId}/contacts?limit=${PAGE}&offset=${offset}&sort=asc`);
    contacts.push(...page.contacts);
    if (page.contacts.length < PAGE) return contacts;
  }
}

function isWindows(contact) {
  return String(contact.attributes?.OS ?? '').toLowerCase() === 'windows';
}

function reachable(contact, listId) {
  return !contact.emailBlacklisted && !(contact.listUnsubscribed ?? []).includes(listId);
}

async function audience() {
  const contacts = (await listContacts(config.listId)).filter((contact) => reachable(contact, config.listId));
  const launch = contacts.filter((contact) => !isWindows(contact));
  return { launch, windows: contacts.length - launch.length };
}

async function waitlistFolder() {
  const { folderId } = await brevo('GET', `/contacts/lists/${config.listId}`);
  return folderId;
}

async function testerListId() {
  const folderId = await waitlistFolder();
  const { lists = [] } = await brevo('GET', `/contacts/folders/${folderId}/lists?limit=50`);
  const existing = lists.find((list) => list.name === TESTER_LIST);
  if (existing) return existing.id;
  const { id } = await brevo('POST', '/contacts/lists', { folderId, name: TESTER_LIST });
  return id;
}

async function sendTest(campaignId, email) {
  const listId = await testerListId();
  await brevo('POST', '/contacts', { email, listIds: [listId], updateEnabled: true });
  await brevo('POST', `/emailCampaigns/${campaignId}/sendTest`, { emailTo: [email] });
}

async function createAudienceList(emails) {
  const folderId = await waitlistFolder();
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const { id } = await brevo('POST', '/contacts/lists', { folderId, name: `Launch email, macOS and Linux (${stamp})` });
  for (let start = 0; start < emails.length; start += ADD_BATCH) {
    await brevo('POST', `/contacts/lists/${id}/contacts/add`, { emails: emails.slice(start, start + ADD_BATCH) });
  }
  return id;
}

function html() {
  const button =
    'display:inline-block;background:#f5c518;color:#14140f;font-weight:600;font-size:15px;' +
    'text-decoration:none;padding:14px 26px;border-radius:12px';
  const paragraph = 'margin:0 0 16px;font-size:16px;line-height:26px;color:#3d3a2c';
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f6f4ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ea">
<tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf5;border:1px solid #d8d1b8;border-radius:20px">
<tr><td style="padding:36px 36px 8px">
<img src="https://uncached.app/apple-touch-icon.png" width="48" height="48" alt="Uncached" style="display:block;border:0">
</td></tr>
<tr><td style="padding:20px 36px 36px">
<h1 style="margin:0 0 20px;font-size:28px;line-height:34px;color:#1b1b15;letter-spacing:-0.5px">Uncached is out</h1>
<p style="${paragraph}">You asked to hear when Uncached was ready. It is.</p>
<p style="${paragraph}">It finds the node_modules, target, Pods and other build folders your tools can rebuild, leaves alone any project with work that isn't pushed, and moves the rest to the Trash.</p>
<p style="${paragraph}">Free for macOS and Linux, with no account.</p>
<p style="margin:28px 0"><a href="https://uncached.app/download" style="${button}">Download Uncached</a></p>
<p style="${paragraph}">Pro adds scheduled cleanups and the full history, at $4.99 a year or $14.99 once: <a href="https://uncached.app/pricing" style="color:#765800">uncached.app/pricing</a>.</p>
<p style="${paragraph}">Reply to this email if anything breaks. I read every one.</p>
<p style="margin:0;font-size:16px;line-height:26px;color:#1b1b15">Natan</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function buildCampaign(testEmail) {
  const { launch } = await audience();
  if (launch.length === 0) throw new Error('nobody to send to');
  const listId = await createAudienceList(launch.map((contact) => contact.email));
  const { id } = await brevo('POST', '/emailCampaigns', {
    name: `Launch — ${new Date().toISOString().slice(0, 10)}`,
    subject: SUBJECT,
    previewText: PREVIEW,
    sender: config.sender,
    replyTo: config.replyTo,
    htmlContent: html(),
    recipients: { listIds: [listId] },
  });
  await sendTest(id, testEmail);
  console.log(`campaign ${id}: draft for ${launch.length} contacts, test sent`);
  console.log(`send it with: node --env-file=.env scripts/send-launch-email.mjs --send ${id}`);
}

async function preview() {
  const { launch, windows } = await audience();
  const file = join(tmpdir(), 'uncached-launch-email.html');
  writeFileSync(file, html());
  console.log(`would send to ${launch.length} contacts; ${windows} waiting for Windows are left out`);
  console.log(`preview: ${file}`);
}

function argument(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? null : (process.argv[index + 1] ?? '');
}

async function main() {
  if (!config.apiKey) throw new Error('BREVO_API_KEY is not set; put it in .env and run with --env-file=.env');

  const testEmail = argument('--test');
  const campaignId = argument('--send');
  const existingCampaign = argument('--campaign');

  if (campaignId !== null) {
    if (!/^\d+$/.test(campaignId)) throw new Error('--send takes the campaign id printed by --test');
    await brevo('POST', `/emailCampaigns/${campaignId}/sendNow`);
    console.log(`campaign ${campaignId} is sending`);
    return;
  }
  if (testEmail !== null) {
    if (!testEmail.includes('@')) throw new Error('--test takes an email address');
    if (existingCampaign !== null) {
      if (!/^\d+$/.test(existingCampaign)) throw new Error('--campaign takes a campaign id');
      await sendTest(existingCampaign, testEmail);
      console.log(`campaign ${existingCampaign}: test sent`);
      console.log(`send it with: node --env-file=.env scripts/send-launch-email.mjs --send ${existingCampaign}`);
      return;
    }
    await buildCampaign(testEmail);
    return;
  }
  await preview();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
