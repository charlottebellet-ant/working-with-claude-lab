const fs = require('fs');
const path = require('path');
const { loadApp, HTML_PATH } = require('./setup/loadApp');

const CSS_PATH = path.resolve(path.dirname(HTML_PATH), 'style.css');
const css = () => fs.readFileSync(CSS_PATH, 'utf8');

const theme = () => document.documentElement.getAttribute('data-theme');
const toggle = () => document.getElementById('theme-toggle');

afterEach(() => {
  jest.restoreAllMocks();
  delete window.matchMedia;
});

describe('AC-1: toggle button', () => {
  test('exists in the header', async () => {
    await loadApp();
    expect(document.querySelector('#app-header #theme-toggle')).not.toBeNull();
  });

  test('the label names the theme you will get', async () => {
    await loadApp();
    expect(toggle().textContent).toBe('Light theme');
    toggle().click();
    expect(toggle().textContent).toBe('Dark theme');
  });

  test('clicking switches dark to light and back', async () => {
    await loadApp();
    toggle().click();
    expect(theme()).toBe('light');
    toggle().click();
    expect(theme()).toBe('dark');
  });
});

describe('AC-2: data-theme and CSS variables', () => {
  test('style.css defines a light override block', () => {
    expect(css()).toMatch(/\[data-theme="light"\]/);
  });

  test('chart rules use variables, not hex colours', () => {
    const rules = css().match(/\.chart-svg[^{]*\{[^}]*\}/g);
    expect(rules.length).toBeGreaterThanOrEqual(4);
    rules.forEach((rule) => {
      expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    });
    expect(rules.join('\n')).toMatch(/fill:\s*var\(--/);
  });

  test('app.js contains no colour literals', () => {
    const js = fs.readFileSync(path.join(path.dirname(CSS_PATH), 'app.js'), 'utf8');
    expect(js).not.toMatch(/#[0-9a-fA-F]{6}\b|rgba?\(/);
  });
});

describe('AC-3: persistence', () => {
  test('a click stores the chosen theme', async () => {
    await loadApp();
    toggle().click();
    expect(window.localStorage.getItem('theme')).toBe('light');
    toggle().click();
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  test('a stored light theme is restored on load', async () => {
    await loadApp(undefined, { storage: { theme: 'light' } });
    expect(theme()).toBe('light');
    expect(toggle().textContent).toBe('Dark theme');
  });

  test('a stored dark theme is restored on load', async () => {
    await loadApp(undefined, { storage: { theme: 'dark' } });
    expect(theme()).toBe('dark');
    expect(toggle().textContent).toBe('Light theme');
  });

  test('a localStorage that throws does not break the app or the toggle', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    const { document: doc } = await loadApp();
    expect(theme()).toBe('dark');
    toggle().click();
    expect(theme()).toBe('light');
    expect(doc.querySelector('#kpi-orders .kpi-value').textContent).toBe('624');
  });
});

describe('AC-4: dark by default, OS setting ignored', () => {
  test('with nothing stored the theme is dark and the label offers light', async () => {
    await loadApp();
    expect(theme()).toBe('dark');
    expect(toggle().textContent).toBe('Light theme');
  });

  test('loading does not persist the default', async () => {
    await loadApp();
    expect(window.localStorage.getItem('theme')).toBeNull();
  });

  test('an invalid stored value falls back to dark', async () => {
    await loadApp(undefined, { storage: { theme: 'purple' } });
    expect(theme()).toBe('dark');
  });

  test('an OS that prefers light is ignored', async () => {
    const matchMedia = jest.fn((query) => ({
      matches: query.includes('prefers-color-scheme: light'),
      media: query,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {}
    }));
    window.matchMedia = matchMedia;
    await loadApp();
    expect(theme()).toBe('dark');
    expect(matchMedia).not.toHaveBeenCalled();
  });

  test('the CSS never consults prefers-color-scheme', () => {
    expect(css()).not.toMatch(/prefers-color-scheme/);
  });

  test('index.html starts as dark, before any script runs', () => {
    expect(fs.readFileSync(HTML_PATH, 'utf8')).toMatch(/<html[^>]*data-theme="dark"/);
  });
});

describe('no flash: head script applies the stored theme before first paint', () => {
  function runHeadScript(stored) {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
    const script = head.match(/<script>([\s\S]*?)<\/script>/);
    expect(script).not.toBeNull();
    window.localStorage.clear();
    if (stored !== undefined) window.localStorage.setItem('theme', stored);
    document.documentElement.setAttribute('data-theme', 'dark');
    new Function(script[1])(); // eslint-disable-line no-new-func
    return theme();
  }

  test('applies a stored light theme', () => {
    expect(runHeadScript('light')).toBe('light');
  });

  test('keeps dark for nothing stored or junk', () => {
    expect(runHeadScript(undefined)).toBe('dark');
    expect(runHeadScript('purple')).toBe('dark');
  });
});
