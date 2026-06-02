export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        'surface-hover': 'var(--surface-hover)',
        'surface-elevated': 'var(--surface-elevated)',
        border: 'var(--border)',
        'border-focus': 'var(--border-focus)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-shadow': 'var(--primary-shadow)',
        secondary: 'var(--secondary)',
        'secondary-hover': 'var(--secondary-hover)',
        'accent-cyan': 'var(--accent-cyan)',
        'accent-green': 'var(--accent-green)',
        'accent-pink': 'var(--accent-pink)',
        'accent-orange': 'var(--accent-orange)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        'error-bg': 'var(--error-bg)',
        info: 'var(--info)',
        'brand-google': 'var(--brand-google)',
        'brand-github': 'var(--brand-github)',
        'brand-linkedin': 'var(--brand-linkedin)',
      }
    },
  },
  plugins: [],
}

