// Builds the HTML for a building's detail panel from profile.json.

import profile from '../../../content/profile.json';
import type { Ref } from './world';
import { GAMES } from '../arcade/catalog';
import { BUILT, museumHtml } from './museum';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const list = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

const link = (href: string, label: string) =>
  `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;

interface Media { type: 'image' | 'video' | 'doc'; src: string; poster?: string; w: number; h: number; alt: string }

// Campaign work. Nothing downloads until the panel opens: images are lazy,
// and videos fetch only their poster until someone presses play.
const gallery = (items: Media[], title = 'Campaign work') => `<h3>${esc(title)}</h3><div class="media-grid">${items
  .map((m) => m.type === 'doc'
    ? `<figure><a href="${esc(m.src)}" target="_blank" rel="noopener"><img src="${esc(m.poster ?? '')}" alt="" width="${m.w}" height="${m.h}" loading="lazy" decoding="async"><figcaption>${esc(m.alt)} <span class="ext" aria-label="(PDF, opens in a new tab)">↗</span></figcaption></a></figure>`
    : m.type === 'video'
    ? `<figure><video controls playsinline preload="none" poster="${esc(m.poster ?? '')}" width="${m.w}" height="${m.h}" aria-label="${esc(m.alt)}"><source src="${esc(m.src)}" type="video/mp4"></video></figure>`
    : `<figure><img src="${esc(m.src)}" alt="${esc(m.alt)}" width="${m.w}" height="${m.h}" loading="lazy" decoding="async"></figure>`)
  .join('')}</div>`;

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
        html: `<p class="lead">${esc(e.summary)}</p>${list(e.bullets)}${'media' in e ? gallery(e.media as Media[], 'mediaTitle' in e ? (e.mediaTitle as string) : undefined) : ''}`,
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
    case 'contact': {
      const l = profile.links;
      const ed = profile.education;
      return {
        kicker: 'Post Office',
        title: profile.name,
        html: `<p class="lead">${esc(ed.degree.replace('Bachelor of Applied Science in ', ''))} at the University of Waterloo (expected ${esc(ed.expected)}). Open to ${esc(profile.seeking)} in forward deployed engineering, technical PM, data engineering, and AI engineering.</p>
          <p class="links">${link(`mailto:${l.email}`, l.email)}</p>
          <p class="links">${link(l.linkedin, 'LinkedIn')} ${link(l.github, 'GitHub')} ${link(l.devpost, 'Devpost')}</p>
          <h3>How this site is built</h3>
          <dl class="built">${BUILT.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          <h3>Approach</h3>
          ${profile.lessons.map((x) => `<p><strong>${esc(x.title)}.</strong> ${esc(x.body)}</p>`).join('')}`,
      };
    }
    case 'trophies': {
      const items = [
        ...profile.awards.map((a) => ({ title: a.title, meta: `${a.issuer} · ${a.date}` })),
        ...profile.hackathons.map((h) => ({ title: `${h.place}, ${h.event}`, meta: 'link' in h ? h.project : 'Hackathon' })),
      ];
      return {
        kicker: 'Hall of Fame',
        title: 'Trophy case',
        html: `<ul class="trophies">${items
          .map((t) => `<li><span class="cup" aria-hidden="true"></span><span>${esc(t.title)}<br><small>${esc(t.meta)}</small></span></li>`)
          .join('')}</ul>`,
      };
    }
    case 'hackathons': {
      return {
        kicker: 'Podium',
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
          <p class="game-note">You may have noticed games scattered across the city. They were big inspirations for how I thought about UX, product design, and development growing up.</p>
          <ul class="game-list">${GAMES.map((g) => `<li><button type="button" class="game-btn" data-game="${g.id}">
            <span class="game-name">${esc(g.title)}</span><span class="game-blurb">${esc(g.blurb)}</span></button></li>`).join('')}</ul>`,
      };
    }
    case 'museum':
      return { kicker: 'City Square', title: 'Museum of Favourites', html: museumHtml() };
    case 'client': {
      return {
        kicker: 'Downtown AI District',
        title: 'Hauser Industries',
        html: `<p class="lead">Hauser Industries, a furniture company, was our enterprise client through Communitech's AI@WORK program.</p>
          <p><button type="button" class="game-btn inline" data-goto="altaml">See the project at AltaML x Communitech</button></p>`,
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
