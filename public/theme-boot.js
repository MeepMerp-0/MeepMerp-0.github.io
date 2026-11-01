// Sets the theme before the first paint, so a light-theme visitor never sees a dark flash while React loads.
// Same key and rule as src/hooks/useTheme.js.
try {
  var saved = localStorage.getItem('theme-choice');
  document.documentElement.dataset.theme = saved === 'light' || saved === 'dark' ? saved
    : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
} catch {
  document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
