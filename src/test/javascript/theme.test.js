const fs = require('fs');
const path = require('path');
const { loadApp, readIndexHtml, HTML_PATH } = require('./setup/loadApp');

const CSS_PATH = path.join(path.dirname(HTML_PATH), 'style.css');
const readCss = () => fs.readFileSync(CSS_PATH, 'utf8');

const root = () => document.documentElement;
const toggle = () => document.getElementById('theme-toggle');

beforeEach(() => {
  // loadApp() only resets <body>; <html> and localStorage would leak between tests.
  localStorage.clear();
  root().removeAttribute('data-theme');
  delete window.matchMedia;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('AC-4: dark by default, OS setting ignored', () => {
  test('opens dark when nothing is stored', async () => {
    await loadApp();
    expect(root().getAttribute('data-theme')).toBe('dark');
    expect(toggle().textContent).toMatch(/light/i);
  });

  test('stays dark when the OS prefers light, and never asks the OS', async () => {
    window.matchMedia = jest.fn((query) => ({
      matches: query.includes('light'),
      media: query,
      addEventListener() {},
      removeEventListener() {}
    }));
    await loadApp();
    expect(root().getAttribute('data-theme')).toBe('dark');
    expect(window.matchMedia).not.toHaveBeenCalled();
  });

  test('no prefers-color-scheme in the CSS, and the page ships with data-theme="dark"', () => {
    expect(readCss()).not.toMatch(/prefers-color-scheme/);
    expect(readIndexHtml()).toMatch(/<html[^>]*\sdata-theme="dark"/);
  });

  test('an invalid stored value falls back to dark', async () => {
    localStorage.setItem('ops-theme', 'purple');
    await loadApp();
    expect(root().getAttribute('data-theme')).toBe('dark');
  });

  test('a stored choice still beats the default', async () => {
    localStorage.setItem('ops-theme', 'light');
    await loadApp();
    expect(root().getAttribute('data-theme')).toBe('light');
    expect(toggle().textContent).toMatch(/dark/i);
  });

  test('unreadable localStorage falls back to dark without crashing', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    await loadApp();
    expect(root().getAttribute('data-theme')).toBe('dark');
  });
});

describe('AC-1 to AC-3: toggle, data-theme + CSS variables, persistence', () => {
  test('clicking the toggle switches dark -> light -> dark and relabels the button', async () => {
    await loadApp();
    toggle().click();
    expect(root().getAttribute('data-theme')).toBe('light');
    expect(toggle().textContent).toMatch(/dark/i);
    toggle().click();
    expect(root().getAttribute('data-theme')).toBe('dark');
    expect(toggle().textContent).toMatch(/light/i);
  });

  test('the choice is stored and restored on the next load', async () => {
    await loadApp();
    toggle().click();
    expect(localStorage.getItem('ops-theme')).toBe('light');
    await loadApp();
    expect(root().getAttribute('data-theme')).toBe('light');
  });

  test('a failing localStorage write does not break the toggle', async () => {
    await loadApp();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    toggle().click();
    expect(root().getAttribute('data-theme')).toBe('light');
  });

  test('CSS defines both themes and the chart rules use variables, not hex colours', () => {
    const css = readCss();
    expect(css).toMatch(/:root\[data-theme="light"\]/);
    expect(css).toMatch(/:root\[data-theme="dark"\]/);
    const chartRules = css.match(/\.chart-svg \.[^{]+\{[^}]*\}/g) || [];
    const colourRules = chartRules.filter((rule) => /fill:/.test(rule));
    expect(colourRules.length).toBeGreaterThanOrEqual(3);
    colourRules.forEach((rule) => {
      expect(rule).toMatch(/fill:\s*var\(--/);
      expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    });
  });
});
