# Mechanical Workshop Management System

A complete, end-to-end web application for managing an automobile service center. 
Features tool inventory, spare parts management, customer records, service history, billing with GST, and automated service reminders.

## Tech Stack
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Glassmorphism UI
- **Database**: Local JSON Store (simulated structured database)
- **State**: Server Actions & React Hooks

## Features
- **Dashboard**: Real-time overview of revenue, stock value, and service alerts.
- **Inventory Control**: Track tools and spare parts with low-stock alerts.
- **Customer Management**: Detailed vehicle history and service timeline.
- **Billing System**: Create professional invoices with automatic GST calculation and stock deduction.
- **Service Reminders**: Auto-calculation of 150-day service cycles to flagship due/overdue vehicles.
- **Analytics**: Insights into top-performing parts and revenue streams.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure
- `src/app`: Page routes and layouts
- `src/components`: Reusable UI components (Sidebar, Modals, Forms)
- `src/lib/db.ts`: Mock Database logic (reads/writes to `data/db.json`)
- `src/actions.ts`: Server Actions for mutations (Add Product, Save Service)
- `src/types`: TypeScript definitions

## Note
The application uses a local file-based database (`data/db.json`) which is created automatically on first run. 
Ensure the application has write permissions to the folder.

---
Designed for premium aesthetics and real-world mechanic shop workflows.
