# Moto Isla Raffle 🏍️

A modern, full-stack raffle application built with Next.js, featuring real-time ticket reservations, secure payment processing, and comprehensive admin management.

## 🚀 Features

### Core Functionality
- **Real-time Raffle Management**: Create and manage motorcycle raffles with dynamic ticket pools
- **Secure Ticket Reservations**: 15-minute reservation system with automatic cleanup
- **Payment Integration**: Bank transfer instructions with WhatsApp confirmation
- **Admin Dashboard**: Complete raffle and order management interface
- **Real-time Updates**: Live order status updates via Supabase realtime

### Technical Highlights
- **React Query Integration**: Optimized data fetching with automatic caching and background updates
- **Form Validation**: React Hook Form with Zod schema validation
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Modern UI built with Tailwind CSS and Shadcn UI components
- **Database**: Supabase with PostgreSQL backend

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Supabase Hosting (Web Apps)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd moto-isla-raffle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in your Supabase credentials and other required variables.

4. **Start Supabase locally** (if using local development)
   ```bash
   npx supabase start
   ```

5. **Run database migrations**
   ```bash
   npx supabase db reset
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-specific endpoints
│   │   ├── cleanup/       # Ticket cleanup system
│   │   ├── orders/        # Order management
│   │   └── tickets/       # Ticket operations
│   ├── checkout/          # Payment flow
│   └── page.tsx           # Main raffle page
├── components/            # Reusable UI components
│   ├── admin/            # Admin-specific components
│   ├── raffle/           # Raffle display components
│   └── ui/               # Base UI components (Shadcn)
├── hooks/                # Custom React hooks
│   ├── useApi.ts         # React Query API hooks
│   ├── useCart.ts        # Shopping cart logic
│   └── useReservationTimer.ts # Timer management
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Database client
│   ├── types.ts          # TypeScript definitions
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Zod schemas
└── providers/            # React context providers
    └── QueryProvider.tsx # React Query setup
```

## 🔧 Key Components

### React Query Integration
- **Custom Hooks**: Centralized API logic with automatic caching
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Background Refetching**: Keeps data synchronized across components
- **Error Handling**: Robust error management with retry logic

### Ticket Reservation System
- **15-minute Reservations**: Automatic ticket locking during checkout
- **Cleanup Mechanism**: Expired tickets automatically released back to pool
- **Real-time Updates**: Live ticket availability updates
- **Conflict Resolution**: Prevents double-booking of tickets

### Admin Dashboard
- **Raffle Management**: Create, edit, and manage raffles
- **Order Tracking**: Monitor all orders and payment status
- **Statistics**: View raffle performance and sales data
- **Bulk Operations**: Efficient management of multiple items

## 🚦 Recent Updates

### ✅ Completed (December 2024)
- **TypeScript Build Fixes**: Resolved all production build errors
  - Fixed Next.js 15 API route parameter typing issues
  - Corrected Cart component type mismatches
  - Added Suspense boundary for useSearchParams in checkout
  - Removed unused variables and improved type safety
- **Mock Data Removal**: Eliminated all hardcoded mock data
  - Cart component now uses real props instead of mock items
  - useCart hook requires proper raffle ID validation
  - All components now rely on actual API data
- **React Query Integration**: Full migration from manual state management
- **Admin Dashboard**: Complete order management and analytics system
- **Ticket System**: Real-time reservations with automatic cleanup
- **Payment Flow**: WhatsApp integration with bank transfer instructions

### 🔄 Current Status
- ✅ **Production Ready**: Build passes successfully without errors
- ✅ **Type Safe**: Full TypeScript compliance with proper typing
- ✅ **No Mock Data**: All components use real data from API/props
- ✅ **Admin Features**: Complete raffle and order management
- ✅ **Real-time Updates**: Live order status and ticket availability
- ✅ **Payment Integration**: Bank transfer with WhatsApp confirmation

## 🗺️ Development Roadmap

### Phase 1: Production Enhancements (Q1 2025)
- [ ] **Security Hardening**
  - Implement rate limiting on API endpoints
  - Add CSRF protection for all routes
  - Enhanced input validation and sanitization
  - Secure admin authentication with sessions
  - Move hardcoded keys to environment variables

- [ ] **Payment Integration**
  - Stripe/PayPal integration for direct payments
  - Automated payment confirmation webhooks
  - Receipt generation and email notifications
  - Multi-currency support (MXN, USD)

- [ ] **User Experience**
  - User registration and login system
  - Order history for registered users
  - Email notifications for order status
  - Mobile-responsive improvements

### Phase 2: Advanced Features (Q2 2025)
- [ ] **Enhanced Admin Dashboard**
  - Advanced analytics with charts and graphs
  - Bulk operations for tickets and orders
  - CSV/Excel export functionality
  - Real-time dashboard with live updates
  - Customer management system

- [ ] **Raffle Enhancements**
  - Multiple prize tiers per raffle
  - Scheduled automatic draws
  - Video streaming for live draws
  - Social sharing integration
  - Referral system with bonuses

- [ ] **Mobile Application**
  - React Native mobile app
  - Push notifications for winners
  - Offline ticket viewing
  - Mobile payment integration

### Phase 3: Scale & Enterprise (Q3-Q4 2025)
- [ ] **Performance & Scale**
  - CDN integration for global performance
  - Database optimization and indexing
  - Caching strategies (Redis)
  - Load balancing for high traffic

- [ ] **Internationalization**
  - Multi-language support (ES, EN)
  - Regional payment methods
  - Currency conversion
  - Localized content management

- [ ] **Enterprise Features**
  - Multi-tenant architecture
  - White-label solutions
  - API for third-party integrations
  - Advanced reporting and compliance

### Immediate Next Steps (This Week)
1. **Security Audit**: Implement basic rate limiting and CSRF protection
2. **Code Quality**: Address remaining ESLint warnings in API routes
3. **Testing**: Add comprehensive test suite for critical components
4. **Documentation**: Create API documentation and deployment guide
5. **Performance**: Optimize bundle size and implement lazy loading

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when implemented)
npm run test
```

## 📱 API Documentation

### Core Endpoints
- `GET /api/tickets?raffle_id={id}` - Fetch available tickets
- `POST /api/tickets` - Reserve tickets and create order
- `GET /api/orders/{orderId}` - Validate order status
- `POST /api/cleanup` - Release expired ticket reservations

### Admin Endpoints
- `GET /api/admin/raffles` - List all raffles
- `POST /api/admin/raffles` - Create new raffle
- `DELETE /api/admin/raffles/{id}` - Cancel raffle
- `GET /api/admin/stats` - Get dashboard statistics

## 🚀 Deployment

The production build is uploaded to Supabase Hosting:

```bash
# Build the application
npm run build

# Optional: preview the production server locally
npm run start
```

### Supabase Hosting Steps
1. Connect the GitHub repository (or upload a release bundle) in **Supabase Dashboard → Hosting → Web Apps**.
2. Configure all required environment variables from `env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
3. Trigger a deployment; Supabase will run `npm install` and `npm run build` automatically.
4. After deploy, confirm `/` and `/admin` load correctly and Supabase logs show healthy API traffic.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `docs/` folder

---

Built with ❤️ using Next.js, React Query, and Supabase
