# Transaction Flow Documentation

## Overview
This document explains how the transaction flow works when a user completes a booking and transfers time credits.

## Complete Flow

### 1. Mark Complete Button Click
**Location**: `/dashboard/requests` page
- User clicks "Mark Complete" on an ACCEPTED booking
- `handleBookingAction` is called with action "complete"

### 2. Booking Completion
**Backend**: `POST /api/booking/:id/complete-confirm`
- Booking status changes from ACCEPTED → COMPLETED
- Ledger entries created (EARNED for provider, SPENT for receiver)
- Reputation updated (+10 for provider, +5 for receiver)
- Notifications sent to both users

### 3. Transaction Modal Opens
**Frontend**: `TransactionModal` component
- Automatically opens after booking is marked complete
- Shows:
  - Current balance (from `/api/wallet/balance`)
  - Recipient information
  - Pre-filled amount (based on booking hours)
  - Description field

### 4. User Confirms Transaction
**Frontend**: User clicks "Send Credits"
- Validates amount (must be > 0 and <= balance)
- Calls `POST /api/transactions/transfer`

### 5. Credit Transfer
**Backend**: `POST /api/transactions/transfer`
- **Validates**:
  - User authentication
  - Receiver exists
  - Sufficient balance
- **Updates Credits** (in database transaction):
  - Sender: `credits = credits - amount`
  - Receiver: `credits = credits + amount`
- **Creates Transaction Records**:
  - Two TRANSFER type transactions (one for sender, one for receiver)
  - Status: COMPLETED
  - Includes description
- **Creates Ledger Entries**:
  - Sender: SPENT entry
  - Receiver: EARNED entry
  - These are used for stats calculation

### 6. Stats Update
**Backend**: Stats are calculated from LedgerEntry table
- **Total Earned**: Sum of all EARNED ledger entries
- **Total Spent**: Sum of all SPENT ledger entries
- **Balance**: Earned - Spent (calculated in `/api/wallet/balance`)

### 7. Frontend Refresh
**Event System**: Custom event `transactionCompleted`
- Dispatched after successful transaction
- Listened to by:
  - Wallet page (`/dashboard/wallet`)
  - Dashboard page (`/dashboard`)
  - Requests page (already refreshing)

### 8. Rating Modal
**Frontend**: `RatingModal` component
- Opens automatically 500ms after transaction completes
- User can rate the other user (1-5 stars)
- Optional comment field

## Data Flow

```
User clicks "Mark Complete"
    ↓
Booking marked COMPLETED (backend)
    ↓
Transaction Modal opens (frontend)
    ↓
User enters amount and clicks "Send Credits"
    ↓
POST /api/transactions/transfer
    ↓
Database Transaction:
    - Update sender credits (credits - amount)
    - Update receiver credits (credits + amount)
    - Create Transaction records (TRANSFER type)
    - Create LedgerEntry records (SPENT/EARNED)
    ↓
Success response
    ↓
Frontend:
    - Refresh balance
    - Dispatch 'transactionCompleted' event
    - Refresh bookings/history
    - Open Rating Modal
    ↓
All pages listening to event refresh their stats
```

## API Endpoints Used

### Wallet Balance
- **GET** `/api/wallet/balance`
- Returns: `{ balance, earned, spent, credits }`
- Calculated from LedgerEntry table

### Transaction Stats
- **GET** `/api/transactions/stats`
- Returns: `{ credits, reputation, totalEarned, totalSpent, completedTransactions, pendingTransactions }`
- Uses LedgerEntry for earned/spent calculations

### Transfer Credits
- **POST** `/api/transactions/transfer`
- Body: `{ receiverId, amount, description }`
- Updates credits and creates ledger entries

### Transaction History
- **GET** `/api/transactions/history`
- Returns paginated list of transactions
- Shows both Transaction and LedgerEntry records

## Stats Calculation

### Total Earned
```sql
SELECT SUM(hours) FROM LedgerEntry 
WHERE userId = ? AND type = 'EARNED'
```

### Total Spent
```sql
SELECT SUM(hours) FROM LedgerEntry 
WHERE userId = ? AND type = 'SPENT'
```

### Current Balance
```
Balance = Total Earned - Total Spent
```

## Connection Between Pages

1. **Requests Page** → Transaction Modal → Transaction API
2. **Transaction API** → Updates Database → Creates Ledger Entries
3. **Ledger Entries** → Used by Wallet Balance API
4. **Wallet Balance API** → Used by Wallet Page
5. **Stats API** → Uses Ledger Entries → Used by Dashboard
6. **Event System** → Refreshes all pages when transaction completes

## Key Points

- ✅ Both users' stats update automatically (sender SPENT, receiver EARNED)
- ✅ Balance updates immediately after transaction
- ✅ Transaction history shows all transfers
- ✅ Stats are calculated from LedgerEntry (source of truth)
- ✅ All pages refresh automatically via event system
- ✅ Wallet page shows real-time balance and stats

