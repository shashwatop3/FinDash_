# Frontend Architecture - Finance SaaS Platform

## Overview
The frontend is built with **Next.js 14** using the App Router, providing a modern, performant, and type-safe React application with server-side rendering capabilities.

## 🏗️ Architecture

### Core Technologies
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Reusable component library
- **Framer Motion** - Animation library
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation

### Project Structure
```
app/                          # Next.js App Router
├── (auth)/                   # Authentication routes (route groups)
│   ├── sign-in/
│   └── sign-up/
├── (dashboard)/              # Protected dashboard routes
│   ├── accounts/
│   ├── categories/
│   ├── crypto/
│   ├── stocks/
│   └── transactions/
├── api/                      # API routes (Hono backend)
├── globals.css               # Global styles
└── layout.tsx                # Root layout

components/                   # Reusable UI components
├── ui/                       # Base UI components (Shadcn)
├── charts/                   # Chart components
├── forms/                    # Form components
└── layout/                   # Layout components

features/                     # Feature-based modules
├── accounts/
├── categories/
├── summary/
└── transactions/

hooks/                        # Custom React hooks
providers/                    # Context providers
lib/                          # Utility libraries
```

## 🎨 Styling & Design System

### Tailwind Configuration
- Custom color palette with CSS variables
- Dark/light mode support
- Responsive breakpoints
- Custom animations and transitions

### Component Library
Uses **Shadcn/UI** for consistent, accessible components:
- Forms with validation
- Data tables with sorting/filtering
- Charts and visualizations
- Modal dialogs and sheets
- Navigation components

### Animation System
- **Framer Motion** for page transitions and micro-interactions
- **GSAP** for complex animations
- **Lenis** for smooth scrolling
- Custom CSS animations with Tailwind

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px    # Small devices
md: 768px    # Medium devices  
lg: 1024px   # Large devices
xl: 1280px   # Extra large devices
2xl: 1536px  # 2X large devices
```

### Layout Strategy
- Mobile-first approach
- Flexible grid systems
- Adaptive navigation
- Touch-friendly interactions

## 🔄 State Management

### Client State
- **React Query** for server state caching
- **Zustand** for global client state
- React Context for theme and user preferences
- Local state with `useState` and `useReducer`

### Data Fetching
```typescript
// Example: Using React Query
const { data: accounts, isLoading } = useQuery({
  queryKey: ["accounts"],
  queryFn: () => client.api.accounts.$get(),
});
```

## 🛣️ Routing & Navigation

### App Router Structure
- **Route Groups**: `(auth)` and `(dashboard)` for layout organization
- **Dynamic Routes**: `[id]` for dynamic parameters
- **Catch-all Routes**: `[[...route]]` for API routing
- **Parallel Routes**: For complex layouts

### Navigation Components
- Header with user menu
- Sidebar navigation
- Breadcrumbs
- Mobile-responsive menu

## 🔐 Authentication

### Clerk Integration
```typescript
import { useUser, SignIn, SignUp } from "@clerk/nextjs";

// Protected routes
export default function ProtectedPage() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <SignIn />;
  
  return <Dashboard />;
}
```

### Route Protection
- Middleware for route protection
- Layout-based authentication
- Role-based access control

## 📊 Data Visualization

### Chart Components
Built with **Recharts**:
- Area charts for trends
- Bar charts for comparisons
- Pie charts for distributions
- Line charts for time series
- Custom tooltips and legends

### Chart Types
```typescript
// Area Chart Example
<AreaChart data={data} width={800} height={400}>
  <XAxis dataKey="date" />
  <YAxis />
  <Area type="monotone" dataKey="amount" stroke="#8884d8" />
</AreaChart>
```

## 🎯 Performance Optimization

### Next.js Features
- **Server Components** for better performance
- **Static Generation** where possible
- **Image Optimization** with next/image
- **Code Splitting** automatic with Next.js
- **Bundle Analysis** with @next/bundle-analyzer

### Optimization Strategies
- Lazy loading components
- Virtual scrolling for large lists
- Memoization with React.memo
- Debounced search inputs
- Optimistic updates

## 🧪 Development Workflow

### Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run analyze      # Bundle analysis
```

### Code Quality
- **ESLint** with Next.js config
- **TypeScript** strict mode
- **Prettier** for formatting
- **Husky** for git hooks

## 🔧 Configuration Files

### Next.js Config
```javascript
// next.config.mjs
const config = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['example.com'],
  },
};
```

### Tailwind Config
```javascript
// tailwind.config.ts
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      animation: {
        // Custom animations
      },
    },
  },
  plugins: [],
};
```

## 🚀 Deployment

### Vercel Integration
- Automatic deployments from Git
- Preview deployments for PRs
- Environment variable management
- Performance monitoring

### Build Process
1. TypeScript compilation
2. Static optimization
3. Image optimization
4. Bundle analysis
5. Deployment to CDN

## 📱 Mobile Experience

### Progressive Web App
- Service worker for offline capability
- App manifest for installation
- Push notifications
- Background sync

### Touch Interactions
- Swipe gestures
- Pull-to-refresh
- Touch-friendly buttons
- Haptic feedback

## 🔍 SEO & Accessibility

### SEO Optimization
- Meta tags management
- Structured data
- Sitemap generation
- Open Graph tags

### Accessibility
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus management

## 🐛 Error Handling

### Error Boundaries
```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Loading States
- Skeleton loaders
- Spinner components
- Progressive loading
- Error retry mechanisms

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Components](https://ui.shadcn.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Query Documentation](https://tanstack.com/query/latest)
