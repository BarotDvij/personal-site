// Builds the HTML for a building's detail panel from profile.json.

import profile from '../../../content/profile.json';
import type { Ref } from './world';
import { GAMES } from '../arcade/catalog';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const list = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

const link = (href: string, label: string) =>
  `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;

export interface PanelContent {
  kicker: string;
  title: string;
  html: string;
}

export function panelFor(ref: Ref): PanelContent | null {
  switch (ref.type) {
    case 'role': {
      const e = profile.experience.find((x) => x.org === ref.org);
      if (!e) return null;
      return {
        kicker: `${e.dates} · ${e.place}`,
        title: `${e.role}, ${e.org}`,
        html: `<p class="lead">${esc(e.summary)}</p>${list(e.bullets)}`,
      };
    }
    case 'project': {
      const p = profile.projects.find((x) => x.name === ref.name);
      if (!p) return null;
      const links = Object.entries(p.links)
        .map(([k, v]) => link(v as string, k === 'code' ? 'Code' : k === 'devpost' ? 'Devpost' : k))
        .join(' ');
      const badge = 'award' in p && p.award ? `<p class="badge">${esc(p.award as string)}</p>` : '';
      const status = 'status' in p && p.status ? `<p class="badge">${esc(p.status as string)}</p>` : '';
      return {
        kicker: 'Project',
        title: p.name,
        html: `${badge}${status}<p class="lead">${esc(p.tagline)}</p><p class="stack">${p.stack.map(esc).join(' · ')}</p><p class="links">${links}</p>`,
      };
    }
    case 'about': {
      const ed = profile.education;
      return {
        kicker: 'Visitor Center',
        title: profile.name,
        html: `<p class="lead">${esc(profile.headline)}</p>
          <p>${esc(ed.degree)}, ${esc(ed.school)} (expected ${esc(ed.expected)}).</p>
          <h3>How the city works</h3>
          ${list([
            'Every building is a role or project. Click one to open it.',
            'Districts are lenses: marketing, PM, AI, data, and building.',
            'The copper pipes underground are data pipelines, and the packets are real flows of work into the warehouse.',
            'Teal warp pipes jump to the next district.',
          ])}
          <h3>Trophy case</h3>
          <ul class="trophies">${[
            ...profile.hackathons.map((h) => ({ title: `${h.place}, ${h.event}`, meta: h.project.length < 40 ? h.project : 'Hackathon' })),
            ...profile.awards.map((a) => ({ title: a.title, meta: `${a.issuer} · ${a.date}` })),
          ]
            .map((t) => `<li><span class="cup" aria-hidden="true"></span><span>${esc(t.title)}<br><small>${esc(t.meta)}</small></span></li>`)
            .join('')}</ul>
          <h3>Approach</h3>
          ${profile.lessons.map((l) => `<p><strong>${esc(l.title)}.</strong> ${esc(l.body)}</p>`).join('')}`,
      };
    }
    case 'contact': {
      const l = profile.links;
      return {
        kicker: 'Post Office',
        title: 'Send a letter',
        html: `<p class="lead">Open to ${esc(profile.seeking)} in forward deployed engineering, technical PM, and product.</p>
          <p class="links">${link(`mailto:${l.email}`, l.email)}</p>
          <p class="links">${link(l.linkedin, 'LinkedIn')} ${link(l.github, 'GitHub')} ${link(l.devpost, 'Devpost')}</p>`,
      };
    }
    case 'hackathons': {
      return {
        kicker: 'Hall of Fame',
        title: '3 podiums in 7 days',
        html: `<ul class="podium">${profile.hackathons
          .map((h) => `<li><span class="place">${esc(h.place)}</span> <strong>${esc(h.event)}</strong><br>${
            'link' in h && h.link ? link(h.link as string, h.project) : esc(h.project)
          }</li>`)
          .join('')}</ul>`,
      };
    }
    case 'civic': {
      return {
        kicker: 'Kitchener City Hall',
        title: 'Civic life',
        html: `<p class="lead">City planning isn't just a theme here. Some of this city's history happened at the real City Hall.</p>
          ${profile.civic.map((c) => `<p><strong>${esc(c.title)}.</strong> ${esc(c.body)}</p>`).join('')}`,
      };
    }
    case 'arcade': {
      return {
        kicker: 'Arcade Hall',
        title: 'Insert coin',
        html: `<p class="lead">Browser games I grew up on, rebuilt from scratch in the city's own pixel style. Everything runs offline, and each game only downloads when you start it.</p>
          <ul class="game-list">${GAMES.map((g) => `<li><button type="button" class="game-btn" data-game="${g.id}">
            <span class="game-name">${esc(g.title)}</span><span class="game-blurb">${esc(g.blurb)}</span></button></li>`).join('')}</ul>`,
      };
    }
    case 'pipelines': {
      const pattern = /pipeline|dbt|snowflake|airbyte|bigquery|glue|ingestion|warehouse|fivetran|airflow/i;
      const rows = profile.experience.flatMap((e) =>
        e.bullets.filter((b) => pattern.test(b) && !/pipeline accuracy|sales pipeline/i.test(b)).map((b) => ({ org: e.org, b })),
      );
      return {
        kicker: 'Data Lake',
        title: 'The plumbing under the city',
        html: `<p class="lead">Every copper pipe in this city is real data work. Here is what flows through them.</p>
          <ul>${rows.map((r) => `<li>${esc(r.b)} <span class="src">(${esc(r.org)})</span></li>`).join('')}</ul>`,
      };
    }
    default:
      return null;
  }
}

export const highlights = profile.highlights;
