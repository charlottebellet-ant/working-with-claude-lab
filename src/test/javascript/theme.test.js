const fs = require('fs');
const path = require('path');
const { loadApp, readIndexHtml, APP_PATH } = require('./setup/loadApp');

const CSS_PATH = path.join(path.dirname(APP_PATH), 'style.css');

function theme(document) {
  return document.documentElement.getAttribute('data-theme');
}

function toggle(document) {
  return document.getElementById('theme-toggle');
}

/** Custom property names declared inside the first rule whose selector matches. */
function declaredVariables(css, selectorPattern) {
  const match = css.match(new RegExp(selectorPattern + '\\s*\\{([^}]*)\\}'));
  if (!match) {
    return [];
  }
  return Array.from(match[1].matchAll(/(--[\w-]+)\s*:/g), (m) => m[1]).sort();
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  delete window.matchMedia;
});

describe('theme toggle (TODO-231)', () => {
  test('AC-1: the toggle sits in the header and names the theme you will get', async () => {
    const { document } = await loadApp();
    const button = toggle(document);
    expect(button).not.toBeNull();
    expect(document.getElementById('app-header').contains(button)).toBe(true);
    expect(theme(document)).toBe('dark');
    expect(button.textContent).toBe('Light theme');
  });

  test('AC-1: clicking switches between the light and the dark theme', async () => {
    const { document } = await loadApp();
    const button = toggle(document);

    button.click();
    expect(theme(document)).toBe('light');
    expect(button.textContent).toBe('Dark theme');

    button.click();
    expect(theme(document)).toBe('dark');
    expect(button.textContent).toBe('Light theme');
  });

  test('AC-2: colours live in CSS variables only, never in app.js', () => {
    const js = fs.readFileSync(APP_PATH, 'utf8');
    expect(js).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);

    const css = fs.readFileSync(CSS_PATH, 'utf8');
    const hardcoded = css.split('\n').filter((line) => /#[0-9a-fA-F]{3,8}\b/.test(line) && !/^\s*--[\w-]+\s*:/.test(line));
    expect(hardcoded).toEqual([]);

    for (const selector of ['.chart-svg .bar', '.chart-svg .bar.warn', '.chart-svg .bar-label', '.chart-svg .bar-value']) {
      const escaped = selector.replace(/\./g, '\\.');
      const rule = css.match(new RegExp('\\n' + escaped + '\\s*\\{([^}]*)\\}'));
      expect(rule).not.toBeNull();
      expect(rule[1]).toMatch(/fill:\s*var\(--/);
    }

    const light = declaredVariables(css, '\\[data-theme="light"\\]');
    const dark = declaredVariables(css, ':root,\\s*\\[data-theme="dark"\\]');
    expect(light.length).toBeGreaterThan(0);
    expect(dark).toEqual(light);
  });

  test('AC-3: the choice is stored in localStorage and restored on load', async () => {
    const first = await loadApp();
    toggle(first.document).click();
    expect(localStorage.getItem('ops-theme')).toBe('light');

    document.documentElement.removeAttribute('data-theme');
    const second = await loadApp();
    expect(theme(second.document)).toBe('light');
    expect(toggle(second.document).textContent).toBe('Dark theme');
  });

  test('AC-3: the inline <head> script restores the stored theme before the page paints', () => {
    const head = readIndexHtml().match(/<head>([\s\S]*)<\/head>/)[1];
    const inline = head.match(/<script>([\s\S]*?)<\/script>/);
    expect(inline).not.toBeNull();
    const run = () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      new Function(inline[1])();
      return document.documentElement.getAttribute('data-theme');
    };

    localStorage.setItem('ops-theme', 'light');
    expect(run()).toBe('light');

    localStorage.setItem('ops-theme', 'purple');
    expect(run()).toBe('dark');

    localStorage.clear();
    expect(run()).toBe('dark');
  });

  test('AC-4: with nothing stored the default is dark, whatever the OS prefers', async () => {
    window.matchMedia = jest.fn((query) => ({
      matches: query.includes('light'),
      media: query,
      addEventListener() {},
      removeEventListener() {}
    }));
    const { document } = await loadApp();
    expect(theme(document)).toBe('dark');
    expect(toggle(document).textContent).toBe('Light theme');
    expect(window.matchMedia).not.toHaveBeenCalled();
  });

  test('AC-4: an unknown stored value falls back to dark', async () => {
    localStorage.setItem('ops-theme', 'purple');
    const { document } = await loadApp();
    expect(theme(document)).toBe('dark');
  });
});
