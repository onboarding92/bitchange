# UI Consistency & Graphics Improvements

## Design System Standards

### Colors
- **Primary**: Use `bg-primary` and `text-primary-foreground` for main actions
- **Secondary**: Use `bg-secondary` and `text-secondary-foreground` for secondary actions
- **Accent**: Use `bg-accent` and `text-accent-foreground` for highlights
- **Muted**: Use `bg-muted` and `text-muted-foreground` for less important content
- **Destructive**: Use `bg-destructive` and `text-destructive-foreground` for dangerous actions

### Spacing
- **Container padding**: `p-4` on mobile, `p-6` on desktop
- **Section spacing**: `space-y-6` for main sections
- **Card spacing**: `p-6` inside cards
- **Button spacing**: `gap-2` for icon + text

### Typography
- **Page titles**: `text-3xl font-bold tracking-tight`
- **Section titles**: `text-2xl font-semibold`
- **Card titles**: `text-lg font-semibold`
- **Body text**: `text-base` (default)
- **Small text**: `text-sm text-muted-foreground`

### Animations
- **Hover scale**: `hover:scale-102 transition-transform duration-200`
- **Button press**: `active:scale-98`
- **Fade in**: `animate-in fade-in duration-300`
- **Slide in**: `animate-in slide-in-from-bottom-4 duration-500`

### Components
- **Cards**: `rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow`
- **Buttons**: Use shadcn/ui Button component with consistent variants
- **Forms**: Use shadcn/ui Form components with proper validation feedback
- **Loading**: Use Skeleton components or `animate-pulse`

## Page-by-Page Improvements

### Dashboard.tsx
- [x] Add smooth transitions for quick actions
- [ ] Improve asset cards with hover effects
- [ ] Add loading skeletons for balance
- [ ] Better empty state for no assets

### Trading.tsx
- [ ] Improve chart container styling
- [ ] Better order form layout
- [ ] Add micro-interactions for order placement
- [ ] Improve mobile responsiveness

### Deposit.tsx
- [ ] Better payment gateway cards
- [ ] Add hover effects on selectable items
- [ ] Improve QR code display
- [ ] Better copy-to-clipboard feedback

### Withdrawal.tsx
- [ ] Improve form layout and spacing
- [ ] Better address validation feedback
- [ ] Add confirmation dialog styling
- [ ] Improve fee display

### Staking.tsx
- [ ] Better staking plan cards
- [ ] Add APR highlighting
- [ ] Improve active positions table
- [ ] Better maturity date display

### Portfolio.tsx
- [ ] Improve asset allocation chart
- [ ] Better performance metrics display
- [ ] Add trend indicators
- [ ] Improve mobile layout

### Convert.tsx
- [ ] Better currency selector
- [ ] Add swap animation
- [ ] Improve rate display
- [ ] Better confirmation feedback

### Support.tsx
- [ ] Improve ticket form layout
- [ ] Better ticket status badges
- [ ] Add ticket history timeline
- [ ] Improve response display

### Admin Pages
- [ ] Consistent table styling across all admin pages
- [ ] Better filter controls
- [ ] Improve action buttons layout
- [ ] Add bulk action capabilities

## Implementation Priority

1. **High Priority** (User-facing, frequently used)
   - Dashboard
   - Trading
   - Deposit
   - Withdrawal
   - Staking

2. **Medium Priority** (Important but less frequent)
   - Portfolio
   - Convert
   - Support
   - Transaction History

3. **Low Priority** (Admin and settings)
   - Admin pages
   - Account settings
   - KYC pages

## Testing Checklist

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Dark mode consistency
- [ ] All hover states work
- [ ] All animations smooth
- [ ] Loading states present
- [ ] Empty states helpful
- [ ] Error states clear
