# AI Ad Yuugen Developer Portal

A comprehensive web interface for managing AI Ad Yuugen SDK configurations, campaigns, and ad inventory with real-time analytics.

## Features

### 🎯 Dashboard
- Real-time performance metrics
- Revenue and engagement analytics
- Interactive charts and visualizations
- Time range filtering (7d, 30d, 90d)
- Recent activity feed

### ⚙️ SDK Configuration Management
- Create and manage multiple SDK configurations
- Environment-specific settings (development, staging, production)
- Privacy compliance controls (GDPR, CCPA, COPPA)
- Ad format configuration
- Domain allowlisting
- API key management

### 📊 Campaign Management
- Create and manage advertising campaigns
- Budget and schedule configuration
- Advanced targeting options
- Campaign performance tracking
- Pause/resume functionality

### 📦 Ad Inventory Management
- Manage banner, interstitial, and native ads
- Content creation and editing
- Targeting configuration
- Performance metrics
- Status management (active, inactive, pending review)

### 📈 Real-time Analytics
- Live user activity monitoring
- Impressions and clicks per minute
- Revenue tracking
- Performance breakdowns by format and platform

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Development

The development server runs on `http://localhost:3000` with hot reload enabled.

API calls are proxied to `http://localhost:8080` - ensure your backend server is running.

## Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard with analytics
│   ├── SDKConfiguration.tsx  # SDK config management
│   ├── CampaignManager.tsx   # Campaign management
│   ├── InventoryManager.tsx  # Ad inventory management
│   ├── Layout.tsx       # Main layout component
│   └── __tests__/       # Component tests
├── services/            # API services
│   └── api.ts          # API client
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared types
├── __tests__/          # Integration tests
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## API Integration

The portal communicates with the AI Ad Yuugen backend through a REST API:

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Secure API key management

### Endpoints
- `/api/dashboard/metrics` - Dashboard metrics
- `/api/analytics` - Analytics data
- `/api/analytics/realtime` - Real-time metrics
- `/api/sdk/configurations` - SDK configurations
- `/api/campaigns` - Campaign management
- `/api/inventory` - Ad inventory management

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=AI Ad Yuugen Developer Portal
```

### API Configuration

The API client is configured in `src/services/api.ts` with:
- Automatic request/response interceptors
- Error handling
- Authentication token management
- Request timeout configuration

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## Performance Optimization

- Code splitting with React.lazy()
- Memoized components with React.memo()
- Optimized bundle size with Vite
- Efficient chart rendering with Recharts
- Real-time updates with WebSocket fallback

## Security Features

- XSS protection with sanitized inputs
- CSRF protection
- Secure API key storage
- Content Security Policy headers
- Input validation and sanitization

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.