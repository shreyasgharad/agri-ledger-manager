
# AgriLedger - Farmer Transaction Management System

A comprehensive web application for managing farmer transactions, inventory, and billing built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Modules
- **Dashboard**: Real-time statistics and analytics
- **Farmers Management**: Add, edit, and manage farmer profiles
- **Transactions**: Record and track financial transactions
- **Inventory**: Manage bags and product distribution
- **Billing**: Generate and manage bills with WhatsApp integration

### Future Modules (Coming Soon)
- **Reports**: Advanced analytics and reporting dashboard
- **Farmer Portal**: Self-service portal for farmers

### Admin Features
- **Data Management**: Import/Export CSV data
- **Settings**: Business configuration and user management
- **Role-based Access Control**: Admin and Employee roles

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Build Tool**: Vite

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase CLI (for local development)
- Git

## 🚦 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd agriledger
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# For Edge Functions (Server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WhatsApp Integration (Optional)
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_API_TOKEN=your-whatsapp-token
```

### 3. Database Setup

Run the provided SQL migrations in your Supabase project:

```sql
-- See supabase/migrations/ folder for complete schema
-- Or run: supabase db reset (if using Supabase CLI)
```

### 4. Seed Data (Optional)

```sql
-- Create a sample organization
INSERT INTO organizations (name, settings) VALUES 
('Demo Farm Co.', '{"name": "Demo Farm Co.", "address": "123 Farm St", "email": "demo@farm.co"}');

-- Create admin user profile (replace user_id with actual auth user ID)
INSERT INTO profiles (user_id, role, org_id) VALUES 
('your-auth-user-id', 'admin', 'org-id-from-above');
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:8080`

## 🏗 Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard-specific components
│   ├── farmers/           # Farmer management components
│   ├── transactions/      # Transaction components
│   ├── inventory/         # Inventory components
│   ├── billing/          # Billing components
│   ├── layout/           # Layout and navigation
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
│   ├── useAuth.tsx       # Authentication logic
│   ├── useFarmers.ts     # Farmers data management
│   ├── useTransactions.ts # Transactions logic
│   └── useInventory.ts   # Inventory management
├── pages/                # Page components
└── integrations/
    └── supabase/         # Supabase client and types

supabase/
├── functions/            # Edge Functions
│   └── send-whatsapp/   # WhatsApp messaging
└── migrations/          # Database migrations
```

## 🔐 Authentication & Authorization

The app uses role-based access control:

- **Admin**: Full access to all features
- **Employee**: Limited access (no delete/edit capabilities)

Row-Level Security (RLS) is implemented at the database level for multi-tenant support.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests (coming soon)
npm run test:e2e
```

## 🚀 Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy send-whatsapp
```

### 3. Set Environment Variables

In your hosting platform, set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📱 Mobile Support

The application is fully responsive and includes:
- Mobile-optimized navigation
- Touch-friendly interfaces
- Collapsible sidebar for mobile

## 🔮 Future Enhancements

### Reports Module
- Advanced analytics dashboard
- Custom report generation
- Data visualization tools
- Export capabilities

### Farmer Portal
- Self-service transaction history
- Balance inquiries
- Document uploads
- Communication tools

### Integration Roadmap
- SMS notifications
- Payment gateway integration
- Inventory alerts
- Advanced reporting tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: support@agriledger.com

---

Built with ❤️ for the agricultural community
```
