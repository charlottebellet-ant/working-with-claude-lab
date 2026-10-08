const fs = require('fs');
const path = require('path');
const { loadApp, APP_PATH } = require('./setup/loadApp');

const CSS_PATH = path.join(path.dirname(APP_PATH), 'style.css');

function click(document, id) {
  document.getElementById(id).dispatchEvent(new window.Event('click', { bubbles: true }));
}

function theme() {
  return document.documentElement.getAttribute('data-theme');
}

/** The declarations of the first CSS rule whose selector is exactly `selector`. */
function ruleBody(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp('(^|\\n)' + escaped + '\\s*\\{([^}]*)\\}'));
  return match ? match[2] : null;
}

describe('theme toggle (TODO-231)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    delete window.matchMedia;
  });

  test('AC-1: the header has a theme-toggle button that switches the theme', async () => {
    const { document } = await loadApp();
    const toggle = document.getElementById('theme-toggle');
    expect(toggle).not.toBeNull();
    expect(toggle.tagName).toBe('BUTTON');
    expect(document.getElementById('app-header').contains(toggle)).toBe(true);

    click(document, 'theme-toggle');
    expect(theme()).toBe('light');
    click(document, 'theme-toggle');
    expect(theme()).toBe('dark');
  });

  test('AC-1: the toggle label names the theme you get by clicking', async () => {
    const { document } = await loadApp();
    const toggle = document.getElementById('theme-toggle');
    expect(toggle.textContent).toMatch(/light/i);
    expect(toggle.getAttribute('aria-label')).toBe('Switch to light theme');

    click(document, 'theme-toggle');
    expect(toggle.textContent).toMatch(/dark/i);
    expect(toggle.getAttribute('aria-label')).toBe('Switch to dark theme');
  });

  test('AC-2: colours come from CSS variables, with a dark override, and none live in app.js', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    const js = fs.readFileSync(APP_PATH, 'utf8');
    expect(css).toMatch(/\[data-theme="dark"\]\s*\{/);
    for (const selector of ['.chart-svg .bar', '.chart-svg .bar.warn', '.chart-svg .bar-label', '.chart-svg .bar-value']) {
      expect(ruleBody(css, selector)).toMatch(/fill:\s*var\(--/);
    }
    expect(js).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });

  test('AC-3: the choice is saved to localStorage and restored on the next load', async () => {
    const first = await loadApp();
    click(first.document, 'theme-toggle');
    expect(window.localStorage.getItem('ops-theme')).toBe('light');

    document.documentElement.removeAttribute('data-theme');
    const second = await loadApp();
    expect(theme()).toBe('light');
    expect(second.document.getElementById('theme-toggle').textContent).toMatch(/dark/i);
  });

  test('AC-3: an unknown stored value falls back to the default', async () => {
    window.localStorage.setItem('ops-theme', 'purple');
    await loadApp();
    expect(theme()).toBe('dark');
  });

  test('AC-4: dark by default when nothing is stored, whatever the OS prefers', async () => {
    window.matchMedia = jest.fn(() => ({ matches: true, media: '(prefers-color-scheme: light)' }));
    await loadApp();
    expect(theme()).toBe('dark');
  });
});
