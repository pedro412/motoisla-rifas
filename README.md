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
- **Deployment**: Netlify-ready configuration

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

### ✅ Completed (Latest Session)
- **React Query Integration**: Full migration from manual state management
- **Ticket Cleanup System**: Automatic release of expired reservations
- **Form Validation**: Centralized Zod schemas with React Hook Form
- **Admin Components**: Updated to use React Query for data fetching
- **Checkout Flow**: Enhanced with real-time order validation

### 🔄 Current Status
- Application fully functional with React Query
- Automatic ticket cleanup working
- All forms using proper validation
- Real-time updates operational
- Admin dashboard complete

## 🗺️ Roadmap

### Phase 1: Core Enhancements (Next 2-4 weeks)
- [ ] **Payment Integration**
  - Stripe/PayPal integration for direct payments
  - Automated payment confirmation
  - Receipt generation and email notifications

- [ ] **User Authentication**
  - User registration and login system
  - Order history for registered users
  - Profile management

- [ ] **Enhanced Admin Features**
  - Bulk ticket operations
  - Advanced reporting and analytics
  - Export functionality for orders and statistics

### Phase 2: Advanced Features (1-2 months)
- [ ] **Mobile App**
  - React Native mobile application
  - Push notifications for winners
  - Mobile-optimized ticket selection

- [ ] **Social Features**
  - Social media sharing integration
  - Referral system with bonuses
  - Community features and leaderboards

- [ ] **Advanced Raffles**
  - Multiple prize tiers
  - Scheduled automatic draws
  - Video streaming integration for live draws

### Phase 3: Scale & Optimization (2-3 months)
- [ ] **Performance Optimization**
  - CDN integration for images
  - Advanced caching strategies
  - Database optimization

- [ ] **Multi-language Support**
  - Internationalization (i18n)
  - Multiple currency support
  - Regional payment methods

- [ ] **Enterprise Features**
  - Multi-tenant architecture
  - White-label solutions
  - API for third-party integrations

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

The application is configured for deployment on Netlify:

```bash
# Build the application
npm run build

# Deploy to Netlify
npm run deploy
```

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

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
