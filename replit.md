# Overview

This is a comprehensive Daily Sales & Cash Reconciliation System designed for retail point-of-sale operations. The system provides automated sales tracking, real-time cash reconciliation, and comprehensive reporting capabilities. It's built as a web application with Google Workspace integration, allowing retail stores to efficiently manage daily sales data, track cash vs. card transactions, detect discrepancies, and generate automated reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The system uses a modular JavaScript architecture with HTML5 and Bootstrap 5 for the user interface:
- **Single Page Application (SPA)**: Tab-based navigation with four main sections (Data Entry, Reconciliation, Dashboard, Reports)
- **Component-based Design**: Separate classes for different functionalities (SalesReconciliationApp, DashboardManager, ReconciliationEngine, EmailService)
- **Local Storage**: Client-side data persistence for offline capability and performance
- **Responsive Design**: Bootstrap-based responsive UI that works on desktop and mobile devices

## Backend Architecture
The system is designed to work in two environments:
- **Google Apps Script Integration**: Server-side processing with Google Sheets as the database backend
- **Standalone Web Mode**: Client-side only operation using localStorage for data persistence
- **Event-driven Architecture**: Auto-save functionality with 30-second intervals and real-time updates

## Data Management
- **Primary Storage**: Google Sheets serves as the centralized database with protected formulas
- **Local Caching**: localStorage provides offline capability and improved performance
- **Data Structure**: JSON-based data models for sales transactions, reconciliation records, and application settings
- **Validation Layer**: Built-in business rules and data validation to ensure accuracy

## Reconciliation Engine
- **Automated Calculations**: Real-time calculation of expected vs. actual cash positions
- **Discrepancy Detection**: Configurable thresholds for flagging unusual patterns
- **Business Rules Validation**: Maximum returns percentage, minimum opening cash, and discrepancy thresholds
- **Historical Tracking**: Maintains reconciliation history for trend analysis

## Reporting and Analytics
- **Dashboard System**: Real-time metrics and KPIs with Chart.js visualization
- **Chart Generation**: Sales trends, payment method distribution, and reconciliation status
- **Email Reports**: Automated daily summaries and discrepancy alerts
- **Export Capabilities**: CSV and PDF report generation

## Authentication and Authorization
The system relies on Google Workspace authentication when integrated with Google Sheets and Apps Script. In standalone mode, it operates without authentication, suitable for single-user or trusted environment deployments.

# External Dependencies

## Core Frontend Dependencies
- **Bootstrap 5.3.0**: UI framework for responsive design and components
- **Font Awesome 6.4.0**: Icon library for enhanced user interface
- **Chart.js**: Data visualization library for dashboard charts and graphs

## Google Workspace Integration
- **Google Sheets API**: Primary database backend and data storage
- **Google Apps Script**: Server-side automation and processing
- **Gmail API**: Email notification and report delivery system
- **Google Forms**: Optional mobile data entry interface

## Browser APIs
- **localStorage**: Client-side data persistence and caching
- **Date API**: Date handling and formatting for transactions
- **JSON**: Data serialization and deserialization

## Development and Deployment
- **Web Browser**: Modern browser with ES6+ support required
- **Google Account**: Required for Google Workspace integration features
- **HTTPS**: Recommended for production deployment due to localStorage requirements

The system is designed to be lightweight and minimize external dependencies while providing comprehensive functionality for retail sales reconciliation.