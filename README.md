# Veelead Lunch Request App — SPFx Web Part

![SPFx Version](https://img.shields.io/badge/SPFx-1.20.0-green.svg)
![Node Version](https://img.shields.io/badge/Node-18.x-green.svg)
![React Version](https://img.shields.io/badge/React-17-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

A SharePoint Framework (SPFx) web part that allows Veelead employees to submit, view, and manage their daily lunch requests — with automatic confirmation emails and a feedback screen.

---

## Features

| Feature | Description |
|---|---|
| **Submit Lunch Request** | Employees submit for today (morning window) or tomorrow (evening window) |
| **Smart Time Window** | Submit button enabled **4:00 PM – 12:00 PM IST** only |
| **Auto Request#** | Generates `LUR00001` style ID automatically after creation |
| **HR Auto-fill** | HR Name column auto-populated from `HigherOfficial` list |
| **Confirmation Email** | Branded HTML email sent via Microsoft Graph API (no Power Automate) |
| **Monthly Gallery** | Shows all submissions for the current calendar month |
| **Delete with Guard** | Records can be deleted only within 16 hours of creation |
| **Feedback Screen** | Submit lunch feedback (stored in `Comments` column) |
| **Feedback Guard** | Feedback button enabled only if user has a request for today |

---

## SharePoint Lists Required

### 1. Lunch Request

| Column (Display Name) | Internal Name | Type |
|---|---|---|
| Request# | `Request_x0023_` | Single line of text |
| Employee | `Employee` | Person or Group |
| Requested Date | `Requested_x0020_Date` | Date and Time |
| HR Name | `HR_x0020_Name` | Person or Group |
| Comments | `Comments` | Multiple lines of text |
| Indexed_ID | `Indexed_ID` | Number |

### 2. HigherOfficial

| Column (Display Name) | Internal Name | Type |
|---|---|---|
| Role | `Role` | Single line of text |
| Final Approver | `FinalApprover` or `Final_x0020_Approver` | Person or Group |

> **Note:** Add one item with `Role = HR` and set the Final Approver to the HR person. The app tries both `FinalApprover` and `Final_x0020_Approver` automatically.

---

## Project Structure

```
src/
├── common/
│   ├── Constants.ts          # Time window config, list names
│   └── Interfaces.ts         # ILunchRequest, IPersonField, ICurrentUser
├── services/
│   ├── SharePointService.ts  # All SharePoint REST API calls
│   └── GraphService.ts       # Graph API - confirmation email
└── webparts/lunchApp/
    ├── LunchAppWebPart.ts
    └── components/
        ├── LunchApp.tsx               # Main controller component
        ├── ILunchAppProps.ts
        ├── ILunchAppState.ts
        ├── LunchApp.module.scss       # Loading spinner styles
        └── screens/
            ├── HomeScreen.tsx         # Submit, gallery, feedback button
            ├── HomeScreen.module.scss
            ├── FeedbackScreen.tsx     # Feedback form
            └── FeedbackScreen.module.scss
```

---

## Prerequisites

- Node.js 18.x
- SPFx 1.20.0
- Microsoft 365 tenant with SharePoint
- App Catalog configured on the tenant or site collection
- **Graph API admin consent** for `Mail.Send` and `User.Read`

---

## Build & Deploy

### 1. Install dependencies
```powershell
npm install
```

### 2. Local development (workbench)
```powershell
npx gulp serve
```
Open: `https://<your-tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx`

### 3. Build for production
```powershell
npx gulp bundle --ship
npx gulp package-solution --ship
```

### 4. Deploy to SharePoint
1. Upload `solution/lunch-app.sppkg` to your **App Catalog**
2. Click **Deploy** when prompted
3. Go to your target site → **Site Contents** → **Add an App** → **lunch-app**

### 5. Approve Graph API Permissions (Admin required)
1. Go to **SharePoint Admin Center** → **Advanced** → **API access**
2. Approve pending requests for:
   - `Microsoft Graph — Mail.Send`
   - `Microsoft Graph — User.Read`

---

## Submit Button Time Logic

| Current Time (IST) | Submit For | Button State |
|---|---|---|
| 12:00 AM – 11:59 AM | **Today** | ✅ Enabled |
| 12:00 PM – 3:59 PM | — | ❌ Disabled (dead zone) |
| 4:00 PM – 11:59 PM | **Tomorrow** | ✅ Enabled |

---

## Solution

| Property | Value |
|---|---|
| Solution Name | lunch-app |
| Version | 1.0.0 |
| SPFx Version | 1.20.0 |
| Author | Veelead Solutions |
| Compatibility | SharePoint Online |

---

## Version History

| Version | Date | Comments |
|---|---|---|
| 1.0.0 | May 2026 | Initial release — SPFx rewrite of PowerApps app |

---

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**
