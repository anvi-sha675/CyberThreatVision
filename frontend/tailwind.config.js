export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg0:'#050a0f', bg1:'#080e17', bg2:'#0d1520', bg3:'#111d2b', bg4:'#162336',
          cyan:'#00dcb4', cyan2:'#00b894', red:'#ff4757', orange:'#ff9f43',
          yellow:'#ffd32a', blue:'#1e90ff', purple:'#a29bfe',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
}