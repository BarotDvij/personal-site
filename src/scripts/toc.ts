// Contents rail: highlights the section in view and, on narrow screens,
// opens and closes the dropdown behind the hamburger button.

const toc = document.getElementById('toc');
const toggle = document.querySelector<HTMLButtonElement>('.toc-toggle');

if (toc && toggle) {
  const setOpen = (open: boolean) => {
    toc.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    // The dropdown is fixed, so line it up under the button. Clearing the
    // inline style lets the sticky rail use its own top on wide screens.
    toc.style.top = open ? `${Math.round(toggle.getBoundingClientRect().bottom + 6)}px` : '';
  };

  toggle.addEventListener('click', () => setOpen(!toc.classList.contains('open')));

  // Hide / show: on wide screens the rail can collapse into the hamburger
  // button. The choice is remembered. Inside the dropdown the same button
  // reads "show" and puts the rail back.
  const wiki = document.getElementById('wiki');
  const hideBtn = toc.querySelector<HTMLButtonElement>('.toc-hide');
  const STORE = 'dvij.toc';
  const setHidden = (hidden: boolean) => {
    if (!wiki || !hideBtn) return;
    wiki.toggleAttribute('data-toc-hidden', hidden);
    hideBtn.textContent = hidden ? 'show' : 'hide';
    setOpen(false);
    try {
      localStorage.setItem(STORE, hidden ? 'hidden' : 'shown');
    } catch {}
  };
  if (wiki && hideBtn) {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORE);
    } catch {}
    if (saved === 'hidden') {
      wiki.setAttribute('data-toc-hidden', '');
      hideBtn.textContent = 'show';
    }
    hideBtn.addEventListener('click', () => setHidden(!wiki.hasAttribute('data-toc-hidden')));
  }

  document.addEventListener('click', (e) => {
    if (!toc.classList.contains('open')) return;
    const target = e.target as HTMLElement;
    if (toggle.contains(target)) return;
    if (!toc.contains(target) || target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toc.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  matchMedia('(min-width: 1001px)').addEventListener('change', () => setOpen(false));

  // Active section: the last heading that has scrolled past the top of the page.
  const links = new Map<string, HTMLAnchorElement>();
  toc.querySelectorAll<HTMLAnchorElement>('a[data-toc]').forEach((a) => links.set(a.dataset.toc!, a));
  const targets = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => !!el);

  let queued = false;
  const update = () => {
    queued = false;
    let current = 'article';
    for (const el of targets) if (el.getBoundingClientRect().top <= 120) current = el.id;
    links.forEach((a, id) => (id === current ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
}
