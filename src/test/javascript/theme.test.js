const fs = require('fs');
const path = require('path');
const { loadApp, APP_PATH, HTML_PATH } = require('./setup/loadApp');

const html = () => document.documentElement;
const toggle = () => document.getElementById('theme-toggle');

afterEach(() => {
  delete window.matchMedia;
});

describe('default theme (AC-4)', () => {
  test('is dark when nothing is stored', async () => {
    await loadApp();
    expect(html().getAttribute('data-theme')).toBe('dark');
  });

  test('ignores a light OS preference: still dark, and matchMedia is never asked', async () => {
    const matchMedia = jest.fn((query) => ({ matches: query.includes('light'), media: query }));
    window.matchMedia = matchMedia;
    await loadApp();
    expect(html().getAttribute('data-theme')).toBe('dark');
    expect(matchMedia).not.toHaveBeenCalled();
  });

  test('falls back to dark when the stored value is not a known theme', async () => {
    await loadApp({ storedTheme: 'solarized' });
    expect(html().getAttribute('data-theme')).toBe('dark');
  });

  test('style.css and index.html have no prefers-color-scheme rule', () => {
    const css = fs
      .readFileSync(path.join(path.dirname(HTML_PATH), 'style.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/prefers-color-scheme/);
    expect(fs.readFileSync(APP_PATH, 'utf8')).not.toMatch(/matchMedia/);
  });
});

describe('toggle (AC-1, AC-3)', () => {
  test('label names the theme you will get', async () => {
    await loadApp();
    expect(toggle().textContent).toBe('Switch to light theme');
    toggle().click();
    expect(toggle().textContent).toBe('Switch to dark theme');
  });

  test('clicking switches the theme both ways', async () => {
    await loadApp();
    toggle().click();
    expect(html().getAttribute('data-theme')).toBe('light');
    toggle().click();
    expect(html().getAttribute('data-theme')).toBe('dark');
  });

  test('the choice is saved to localStorage', async () => {
    await loadApp();
    toggle().click();
    expect(window.localStorage.getItem('theme')).toBe('light');
  });

  test('a stored light theme is restored on load', async () => {
    await loadApp({ storedTheme: 'light' });
    expect(html().getAttribute('data-theme')).toBe('light');
    expect(toggle().textContent).toBe('Switch to dark theme');
  });

  test('a choice made by clicking survives a reload', async () => {
    await loadApp();
    toggle().click();
    const saved = window.localStorage.getItem('theme');
    await loadApp({ storedTheme: saved });
    expect(html().getAttribute('data-theme')).toBe('light');
  });
});
