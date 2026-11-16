/* projects-data.js — the single source of truth for the Work section.
   Plain script (no module): defines window.PROJECTS.
   Order = display order (list rows, drawer prev/next).
   featured: true  -> large card in the Selected work grid (keep exactly 3).
   heroPill: true  -> pill in the hero stack; pill order follows this array.
   Categories used: Audio · Tools · Client work · Product · Experiments
   build: 'hand-built' (optional). image may be null. */
window.PROJECTS = [
  {
    slug: 'reprise',
    title: 'RepRise',
    kicker: 'An iPhone workout app, in development and coming soon to the App Store: build a plan by hand, from a template or with an AI coach, then log every set and keep the streak alive.',
    category: 'Product',
    year: '2026',
    featured: false,
    heroPill: true,
    role: 'Design, mobile and API development',
    tags: ['React Native', 'Full-stack', 'AI'],
    tech: ['React Native', 'Expo', 'TypeScript', 'Node.js', 'Express', 'Prisma', 'PostgreSQL', 'LLM APIs'],
    image: 'photos/web/reprise-1600.webp',
    imageSmall: 'photos/web/reprise-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Three RepRise phone screens with sample training data: the Today screen with the next workout and weekly ring, a bench press page with a muscle diagram and an estimated one-rep-max chart, and a logged leg day.',
    links: { repo: 'https://github.com/jakecush1/workout-react-native' },
    body: [
      'An iPhone workout planner and tracker. Get a plan from a short questionnaire, pick from 13 programmes ranked for your goal and equipment, or build your own from 96 exercises. Logging pre-fills last session’s numbers, runs a rest timer and tracks streaks, PRs and estimated one-rep max.',
      'The AI plan builder can only return validated exercises that match your equipment, with a rule-based fallback when no model is available. Built with Expo and TypeScript on a Node, Express, Prisma and PostgreSQL API. In development and coming soon to the App Store.'
    ]
  },

  {
    slug: 'city-square',
    title: 'City Square',
    kicker: 'A rainy-night street in Three.js with two doors: one into the Side Proj tavern, one up to Bedroom Studio.',
    category: 'Experiments',
    year: '2026',
    featured: true,
    heroPill: true,
    role: 'Design, 3D, development',
    tags: ['Three.js', 'Procedural', 'Shaders'],
    tech: ['Three.js', 'Canvas textures', 'Custom post-processing', 'Vite', 'Vercel'],
    image: 'photos/web/city-square-1600.webp',
    imageSmall: 'photos/web/city-square-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'City Square: a rainy cobbled street at night between The Garrison Tavern on the left and a neon-signed apartment block on the right.',
    links: { live: 'https://city-square.vercel.app/', repo: 'https://github.com/jakecush1/city-square' },
    body: [
      'The front door to my 3D work: a rainy street with two doors. The tavern opens Side Proj, the apartment opens Bedroom Studio, and each loads inside the page with a way back.',
      'Everything is procedural, with textures painted to canvas at startup, so there are no image downloads. A custom post pass inks the edges and adds paper grain for the illustrated look.'
    ]
  },

  {
    slug: 'bedroom-studio',
    title: 'Bedroom Studio',
    kicker: 'A rainy-night 3D bedroom studio where every machine on the desk is a working instrument, including the JC-808.',
    category: 'Audio',
    year: '2026',
    featured: true,
    heroPill: true,
    role: 'Design, 3D, audio engineering',
    tags: ['Three.js', 'Web Audio', 'DSP'],
    tech: ['Three.js', 'Web Audio API', 'AudioWorklet', 'Basic Pitch', 'Vite', 'Vercel'],
    image: 'photos/web/bedroom-studio-1600.webp',
    imageSmall: 'photos/web/bedroom-studio-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Room 808: a dim 3D bedroom at night with a desk lamp, monitor, drum machine, keyboard and rain outside the window.',
    links: { live: 'https://bedroom-studio-three.vercel.app/', repo: 'https://github.com/jakecush1/bedroom-studio' },
    body: [
      'A lofi 3D bedroom where every machine on the desk is a working audio tool. Click one and the camera walks up and opens it.',
      'The centrepiece is the JC-808, a drum machine and synth built from scratch on the Web Audio API, with twelve modelled voices, a 16-step sequencer, share links and WAV export. Around it are a tuner, autotune, auto-mastering and chiptune tools, all running in the browser.'
    ]
  },

  {
    slug: 'sideproj',
    title: 'Side Proj',
    kicker: 'A band page for Side Project built as an interactive 3D medieval tavern: click the glowing objects to play their songs.',
    category: 'Experiments',
    year: '2026',
    featured: true,
    heroPill: true,
    role: 'Design, 3D, development',
    tags: ['React Three Fiber', '3D', 'Audio'],
    tech: ['React', 'TypeScript', 'React Three Fiber', 'Zustand', 'Howler.js', 'Tailwind CSS', 'Vite'],
    image: 'photos/web/sideproj-1600.webp',
    imageSmall: 'photos/web/sideproj-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'A 3D medieval tavern with a band seated around a round table, a fireplace, banners and a song list panel in the corner.',
    links: { live: 'https://sideproj.ca', repo: 'https://github.com/jakecush1/3js-interactive-tavern' },
    body: [
      'A band page for Side Project built as a 3D medieval tavern. Click a glowing object to hear one of the band’s songs, with a small player in the corner for the setlist.',
      'Built with React Three Fiber, Zustand and Howler.js. Textures are generated at runtime, so the scene downloads no images.'
    ]
  },

  {
    slug: 'vantage-saunas',
    title: 'Vantage Saunas',
    kicker: 'A full launch package for a rooftop sauna company: brand site, interactive 3D design plans, pitch deck, business plan and financial model.',
    category: 'Product',
    year: '2026',
    featured: false,
    heroPill: true,
    role: 'Brand, web, 3D and business planning',
    tags: ['Startup', 'Three.js', 'Web'],
    tech: ['HTML', 'CSS', 'JavaScript', 'Three.js', 'Python', 'Markdown', 'Excel', 'Vercel'],
    image: 'photos/web/vantage-saunas-1600.webp',
    imageSmall: 'photos/web/vantage-saunas-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Vantage marketing site in navy and burnt orange: the headline “The amenity above everything” beside an illustration of a lit sauna suite on a city rooftop at night.',
    links: { live: 'https://vantagesaunas.vercel.app/04-design-plans/', repo: 'https://github.com/jakecush1/vantagesaunas' },
    body: [
      'A launch package for a rooftop sauna company: marketing site, 17-slide pitch deck, business plan, financial model and market research.',
      'The highlight is the interactive design plans: a Three.js model of each suite on a rooftop, viewable as exterior, interior, plan, section or exploded. A Python build keeps the site, deck and drawings quoting the same numbers.'
    ]
  },

  {
    slug: 'ai-photobooth',
    title: 'AI Photobooth',
    kicker: 'A Raspberry Pi photobooth with an iPad kiosk, card payments, on-the-spot prints and AI restyles delivered to your phone.',
    category: 'Product',
    year: '2026',
    featured: false,
    heroPill: true,
    role: 'Co-creator with Isaak: Pi printing, deployment, enclosure',
    tags: ['Raspberry Pi', 'Next.js', 'Convex', 'Python'],
    tech: ['Raspberry Pi', 'Node.js', 'Python', 'Pillow', 'CUPS', 'systemd', 'Next.js', 'React', 'Convex', 'Square POS API', 'CadQuery', '3D printing'],
    image: 'photos/web/ai-photobooth-kiosk-1600.webp',
    imageSmall: 'photos/web/ai-photobooth-kiosk-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'The photobooth kiosk screen: a row of frame choices above a large Take Photos button reading $5.00, tap to pay, four shots, 3-2-1 each time.',
    links: { live: 'https://photobooth-eight-self.vercel.app/', repo: 'https://github.com/isaak1294/photobooth' },
    gallery: [
      {
        image: 'photos/web/ai-photobooth-enclosure-1600.webp',
        imageSmall: 'photos/web/ai-photobooth-enclosure-800.webp',
        alt: 'Line drawings of a 3D-printed enclosure: a vented printer frame on its own, and assembled with an electronics tray on top.',
        caption: 'The 3D-printed enclosure I modelled in CadQuery: a frame around the printer and an electronics tray for the Pi and camera.'
      },
      {
        image: 'photos/web/ai-photobooth-concepts-1600.webp',
        imageSmall: 'photos/web/ai-photobooth-concepts-800.webp',
        alt: 'Two AI-generated concept renders: a walnut booth with a red velvet curtain, and an arcade-cabinet photobooth printing a photo strip.',
        caption: 'Early AI-generated concept renders for the booth’s look. Not the built hardware.'
      }
    ],
    body: [
      'A photobooth built with Isaak. Guests pick a frame on an iPad, tap to pay, and a Raspberry Pi takes four shots, prints the strips and sends the photos to their phone for AI restyles. Convex keeps the kiosk, booth and phone in sync live.',
      'I built the printing side: a crash-safe Python print agent that lays out the strips and sends them to the printer, plus the services and deploy script that keep the booth running unattended. I also modelled the 3D-printed enclosure. Isaak led the web app, backend and payments.'
    ]
  },

  {
    slug: 'obamafy',
    title: 'Obamafy',
    kicker: 'Turn a photo into a flat-ink screenprint poster or a laser-ready engraving, entirely in the browser.',
    category: 'Tools',
    year: '2026',
    featured: false,
    heroPill: true,
    role: 'Design, image processing',
    tags: ['Canvas', 'Image processing', 'Fabrication'],
    tech: ['Vanilla JavaScript', 'Canvas', 'LightBurn export', 'Vercel'],
    image: 'photos/web/obamafy-1600.webp',
    imageSmall: 'photos/web/obamafy-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Poster maker interface with ink controls on the left and a four-colour Hope-style poster of a cat on the right.',
    links: { live: 'https://obamafy.vercel.app', repo: 'https://github.com/jakecush1/obamafy' },
    body: [
      'Turns a photo into a two-to-four-ink screenprint poster in the style of the 2008 Hope poster, with adjustable tone splits, palettes and hatched edges.',
      'A laser mode turns the same image into an engraving and exports a PNG plus a ready-to-run LightBurn file. Everything runs in the browser.'
    ]
  },

  {
    slug: 'mathine',
    title: 'Mathiné',
    kicker: 'A UVic student workspace that pulls Brightspace deadlines into one dashboard, to-do list and calendar.',
    category: 'Product',
    year: '2025',
    featured: false,
    heroPill: true,
    role: 'Full-stack development',
    tags: ['Vue.js', 'Nginx', 'Product'],
    tech: ['Vue.js', 'JavaScript', 'Nginx', 'Linux', 'Brightspace'],
    build: 'hand-built',
    image: 'photos/web/mathine-1600.webp',
    imageSmall: 'photos/web/mathine-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Mathiné landing page on mathine.uvic.ca with UVic branding and a navigation bar for Kanban, Calendar, Brain Dump and Brightspace courses.',
    links: { live: 'https://mathine.uvic.ca' },
    body: [
      'A workspace for UVic students that brings Brightspace deadlines, to-dos, a calendar and notes into one place.',
      'An INSPIRE UVic project. I worked on it in Vue.js, fixing bugs and refining the UX from student feedback.'
    ]
  },

  {
    slug: 'usv-autopilot-ml',
    title: 'USV Autopilot ML',
    kicker: 'Predicting from live telemetry when a remote pilot needs to step in on a station-keeping uncrewed boat, so a 24/7 watch can become an on-call alert.',
    category: 'Experiments',
    year: '2026',
    featured: false,
    heroPill: false,
    role: 'Data analysis and modelling, with Rowan Hall (SENG 474)',
    tags: ['Machine learning', 'Python', 'Marine robotics'],
    tech: ['Python', 'pandas', 'scikit-learn', 'Matplotlib', 'LaTeX'],
    image: 'photos/web/usv-autopilot-ml-1600.webp',
    imageSmall: 'photos/web/usv-autopilot-ml-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Drift model v2 results: predicted against actual east and north drift over the next 60 minutes, and a histogram of position error with a median of 256 m and a 90th percentile of 549 m.',
    links: { repo: 'https://github.com/jakecush1/autonomous-pilot-ML' },
    body: [
      'A UVic SENG 474 project with Rowan Hall. Open Ocean Robotics’ DataXplorer boat has to stay near a retired buoy’s position, and a remote pilot watches it around the clock even though a correction is only needed every few hours. The goal is to predict from telemetry when a pilot is needed, so the watch can become an on-call alert.',
      'So far, a drift model that combines the last hour’s drift with the wind predicts the next hour’s position with R² = 0.83 and a 256 m median error. Those are training-set numbers; held-out testing is next.'
    ]
  },

  {
    slug: 'arbourpros',
    title: 'ArbourPros Trees',
    kicker: 'A clean, fast site for a two-person team of ISA Certified Arborists working in Saskatchewan and BC.',
    category: 'Client work',
    year: '2026',
    featured: false,
    heroPill: false,
    role: 'Design and development',
    tags: ['Small business', 'Static site'],
    tech: ['HTML', 'CSS', 'JavaScript', 'Vercel'],
    image: 'photos/web/arbourpros-1600.webp',
    imageSmall: 'photos/web/arbourpros-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'ArbourPros Trees homepage: an arborist climbing a tall poplar under the headline, with Book an estimate and Call buttons.',
    links: { live: 'https://arbourpros.vercel.app' },
    body: [
      'A site for ArbourPros Trees, a two-person team of ISA Certified Arborists. It needed to look professional, load fast on a phone and get people to call.',
      'Six pages of plain HTML, CSS and JavaScript on Vercel, with a job-photo gallery, tap-to-call on every page and an estimate form that needs no backend.'
    ]
  },

  {
    slug: 'basin-climate-source',
    title: 'Basin Climate Source',
    kicker: 'Climate projections for the Columbia Basin-Boundary region: 40 indicators, three scenarios, mapped to the 2080s.',
    category: 'Client work',
    year: '2023–24',
    featured: false,
    heroPill: false,
    role: 'Full-stack developer intern',
    tags: ['Data platform', 'Maps', 'Full-stack'],
    tech: ['JavaScript', 'Web mapping', 'GIS data', 'Selkirk Innovates'],
    build: 'hand-built',
    image: 'photos/web/basin-climate-source-1600.webp',
    imageSmall: 'photos/web/basin-climate-source-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Columbia Basin Climate Source homepage with a green header, a map of British Columbia and tiles linking to climate projections and impacts.',
    links: { live: 'https://basinclimatesource.ca/climate-projections' },
    body: [
      'A climate projections platform for the Columbia Basin-Boundary region, built by Selkirk Innovates for the Columbia Basin Trust. Users map 40 indicators across three emissions scenarios out to the 2080s and download the data.',
      'I built features as a full-stack developer intern from May 2023 to May 2024, keeping it usable for planners and residents who are not data specialists.'
    ]
  },

  {
    slug: 'autonomous-sinixt',
    title: 'Autonomous Sinixt',
    kicker: 'The Autonomous Sinixt website, hosted and maintained on my own Linux server.',
    category: 'Client work',
    year: '2023–25',
    featured: false,
    heroPill: false,
    role: 'Web development, hosting, maintenance',
    tags: ['WordPress', 'Self-hosting', 'Maintenance'],
    tech: ['WordPress', 'Linux', 'Apache', 'Self-hosted'],
    build: 'hand-built',
    image: 'photos/web/autonomous-sinixt-1600.webp',
    imageSmall: 'photos/web/autonomous-sinixt-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'sinixt.org homepage: a mountain and forest photograph under the heading Our Land, with the site navigation above.',
    links: { live: 'https://sinixt.org/' },
    body: [
      'The public website of the Autonomous Sinixt and their governance body, the Smum iem: their land, history, projects and ways to support the work.',
      'I maintain the site and have hosted it on my own Linux server since 2023.'
    ]
  },

  {
    slug: 'usv-tools',
    title: 'USV Tools',
    kicker: 'Three browser tools for uncrewed surface vessels: battery forecasting, trip distance and vessel separation.',
    category: 'Tools',
    year: '2026',
    featured: false,
    heroPill: false,
    role: 'Engineering, data analysis',
    tags: ['Data tools', 'Python', 'Charts'],
    tech: ['Vanilla JavaScript', 'Chart.js', 'Bootstrap', 'Python', 'pandas', 'NumPy'],
    image: 'photos/web/usv-tools-1600.webp',
    imageSmall: 'photos/web/usv-tools-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'USV Tools mark: an illustrated solar-panelled autonomous vessel on a dark navy background.',
    links: { live: 'usv/' },
    body: [
      'Three browser tools from my Open Ocean Robotics internship. Battery Forecast reads a NOAA marine forecast and predicts when a boat should head home, using a model fitted to months of deployment logs. Route Analyzer measures trip distance from GPS and AIS logs, and Distance Between tracks the gap between two vessels during field tests.',
      'Everything runs in the browser, so operational vessel data never leaves the machine.'
    ]
  },

  {
    slug: 'state-of-the-basin',
    title: 'State of the Basin',
    kicker: 'A regional well-being indicators platform for the Columbia Basin, from census data to community profiles.',
    category: 'Client work',
    year: '2023–24',
    featured: false,
    heroPill: false,
    role: 'Full-stack developer intern',
    tags: ['Data platform', 'Full-stack'],
    tech: ['JavaScript', 'Data tables', 'Selkirk Innovates'],
    build: 'hand-built',
    image: 'photos/web/state-of-the-basin-1600.webp',
    imageSmall: 'photos/web/state-of-the-basin-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'State of the Basin website showing a Population page with census tables beside a sidebar of well-being indicators.',
    links: { live: 'https://stateofthebasin.ca/' },
    body: [
      'A platform tracking social, economic, environmental and cultural well-being across the Columbia Basin, with dozens of indicators and per-community profiles.',
      'I built features during my Selkirk Innovates internship, mostly making dense data tables readable and consistent across a large number of indicator pages.'
    ]
  },

  {
    slug: 'strudel',
    title: 'Strudel Live Studio',
    kicker: 'A focused studio shell around Strudel, the browser pattern language for live-coded music.',
    category: 'Audio',
    year: '2025',
    featured: false,
    heroPill: false,
    role: 'Engineering',
    tags: ['Live coding', 'Audio', 'UI'],
    tech: ['Strudel', 'Tailwind CSS', 'JavaScript'],
    image: 'photos/web/strudel-1600.webp',
    imageSmall: 'photos/web/strudel-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'Strudel Live Studio icon: a purple rounded square with concentric rings and neon shapes, on a near-black background.',
    links: { live: 'media/strudel/' },
    body: [
      'A clean full-screen shell around Strudel, the browser language for live-coding music. Open the tab and start making sound.'
    ]
  },

  {
    slug: 'sudoku',
    title: 'Sudoku',
    kicker: 'A playable Sudoku with a generator and solver written from scratch; every puzzle has exactly one solution.',
    category: 'Experiments',
    year: '2025',
    featured: false,
    heroPill: false,
    role: 'Engineering',
    tags: ['Algorithms', 'Vanilla JS'],
    tech: ['Vanilla JavaScript', 'Backtracking', 'Constraint propagation'],
    image: 'photos/web/sudoku-1600.webp',
    imageSmall: 'photos/web/sudoku-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'A nine-by-nine Sudoku board with a partially filled puzzle on a light background.',
    links: { live: 'media/other/pages/sudokuJs.html' },
    body: [
      'A Sudoku game with a generator and solver written from scratch. Clues are removed one at a time and the board is re-solved after each, so every puzzle has exactly one solution. One HTML file, no dependencies.'
    ]
  },

  {
    slug: 'qr',
    title: 'QR Code Generator',
    kicker: 'Paste a URL or any text and get a print-ready QR code back instantly, generated entirely in the page.',
    category: 'Tools',
    year: '2025',
    featured: false,
    heroPill: false,
    role: 'Engineering',
    tags: ['Utility', 'Canvas'],
    tech: ['Vanilla JavaScript', 'qrcode.js', 'Tailwind CSS', 'Canvas'],
    image: 'photos/web/qr-1600.webp',
    imageSmall: 'photos/web/qr-800.webp',
    imageW: 1600,
    imageH: 1000,
    imageAlt: 'A black QR code above the words QR Code Generator on a white background.',
    links: { live: 'media/qr/' },
    body: [
      'Paste a URL or text and download a QR code as a PNG. It uses the highest error correction, so codes scan even when printed small, and nothing leaves the page.'
    ]
  }
];
