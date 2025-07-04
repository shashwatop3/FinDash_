# FinDash - Modern Financial Dashboard 💰📊

A modern, animated financial SaaS platform built with Next.js, featuring real-time insights, beautiful animations, and a sleek design.

![FinDash Logo](public/logo.svg)

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with smooth animations
- **Real-time Analytics**: Interactive charts and financial insights
- **User Authentication**: Secure login with Clerk
- **Database Integration**: PostgreSQL with Drizzle ORM
- **Performance Optimized**: Fast loading with Next.js optimizations
- **Mobile Responsive**: Works perfectly on all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom animations
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Charts**: Recharts
- **Animations**: Framer Motion, GSAP, Lenis
- **Deployment**: Vercel

## 🎨 Design Features

- **Glass Morphism Effects**: Modern translucent UI elements
- **Gradient Backgrounds**: Beautiful color transitions
- **Neon Glows**: Eye-catching text effects
- **Smooth Animations**: Powered by Framer Motion and GSAP
- **3D Card Effects**: Interactive hover animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Finance-SaaS-Platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Add your database URL, Clerk keys, etc.
```

4. **Run database migrations**
```bash
npm run db:generate
npm run db:migrate
```

5. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run deploy` - Deploy to Vercel (production)
- `npm run deploy:preview` - Deploy preview to Vercel
- `npm run db:generate` - Generate database schema
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
npm run deploy
```

### Manual Deployment

1. Build the application
```bash
npm run build
```

2. The built application will be in the `.next` folder

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── features/              # Feature-specific code
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── providers/             # Context providers
├── public/                # Static assets
└── src/                   # Database and migrations
```

## 🎯 Performance Optimizations

- **Bundle Splitting**: Dynamic imports for better loading
- **Image Optimization**: Next.js Image component
- **Font Loading**: Optimized Google Fonts
- **Caching**: React Query for data caching
- **Build Analysis**: Bundle analyzer included

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) for beautiful animations
- [Clerk](https://clerk.com/) for authentication
- [Vercel](https://vercel.com/) for deployment platform

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ and modern web technologies**
