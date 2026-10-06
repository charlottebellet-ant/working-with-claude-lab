const fs = require('fs');
const { loadApp, APP_PATH } = require('./setup/loadApp');

const THEME_KEY = 'ops-dashboard-theme';

function click(document, id) {
  document.getElementById(id).dispatchEvent(new window.Event('click', { bubbles: true }));
}

function theme() {
  return document.documentElement.getAttribute('data-theme');
}

// loadApp only replaces the <body>, so the <html> attribute and storage carry over between tests.
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  delete window.matchMedia;
});

describe('theme', () => {
  test('starts dark when nothing is stored (AC-4)', async () => {
    const { document } = await loadApp();
    expect(theme()).toBe('dark');
    expect(document.getElementById('theme-toggle').textContent).toBe('Light theme');
  });

  test('ignores an OS preference for light (AC-4)', async () => {
    window.matchMedia = jest.fn((query) => ({
      matches: query.includes('light'),
      media: query,
      addEventListener() {},
      removeEventListener() {}
    }));
    await loadApp();
    expect(theme()).toBe('dark');
  });

  test('falls back to dark for an unknown stored value (AC-4)', async () => {
    localStorage.setItem(THEME_KEY, 'purple');
    await loadApp();
    expect(theme()).toBe('dark');
  });

  test('the toggle switches between dark and light and names the theme you will get (AC-1)', async () => {
    const { document } = await loadApp();
    const button = document.getElementById('theme-toggle');
    // The label names the action, so no pressed state that would contradict it.
    expect(button.hasAttribute('aria-pressed')).toBe(false);

    click(document, 'theme-toggle');
    expect(theme()).toBe('light');
    expect(button.textContent).toBe('Dark theme');
    expect(button.hasAttribute('aria-pressed')).toBe(false);

    click(document, 'theme-toggle');
    expect(theme()).toBe('dark');
    expect(button.textContent).toBe('Light theme');
  });

  test('the choice is stored and restored on the next load (AC-3)', async () => {
    const { document } = await loadApp();
    click(document, 'theme-toggle');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');

    document.documentElement.removeAttribute('data-theme');
    const reloaded = await loadApp();
    expect(theme()).toBe('light');
    expect(reloaded.document.getElementById('theme-toggle').textContent).toBe('Dark theme');
  });

  test('app.js holds no colour values; colours live in style.css (AC-2)', () => {
    const source = fs.readFileSync(APP_PATH, 'utf8');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
