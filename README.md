# Lunch Request App — SPFx Web Part

A SharePoint Framework (SPFx) web part that lets Veelead employees submit daily lunch requests, view their monthly history, and give feedback.

---

## Features

- Submit a lunch request for today (before 12:00 PM) or tomorrow (after 4:00 PM IST)
- Automatically targets **Monday** when submitting on Friday after 4 PM, Saturday, or Sunday (organization is closed on weekends)
- Confirmation email sent via Microsoft Graph after every successful submission
- Gallery shows current-month submissions **plus any upcoming requests** (e.g. a Monday request submitted on Friday appears immediately)
- Feedback can be submitted for the same-day lunch request
- Requests can be deleted within 16 hours of creation

---

## Submission Window Logic

| Time / Day | Submits for |
|---|---|
| Mon–Thu before 12:00 PM | Today |
| Mon–Thu 12:00–4:00 PM | Disabled (dead zone) |
| Mon–Thu after 4:00 PM | Next weekday |
| Friday before 12:00 PM | Today (Friday) |
| Friday 12:00–4:00 PM | Disabled |
| **Friday after 4:00 PM** | **Monday** |
| **Saturday (any time)** | **Monday** |
| **Sunday (any time)** | **Monday** |

---

## Changelog

### v1.2 — 2026-05-29
- **Date timezone fix**: `RequestedDate` is now stored as `YYYY-MM-DDT00:00:00Z` using local date components, preventing the UTC offset from shifting the stored date one day back (IST users were seeing Sunday May 31 instead of Monday June 1).
- **Gallery upcoming fix**: The gallery now shows current-month requests **and** any upcoming future-month submissions. A Monday request submitted on Friday is visible immediately after submission under "& Upcoming".
- **Weekend skip fix**: `getTargetDate()` correctly skips Saturday and Sunday, advancing to Monday in all weekend cases.
- **Email branding**: Header banner updated to light blue with "vee" in blue and "lead" in orange to match the Veelead logo.

### v1.1
- Initial SPFx implementation with SharePoint list integration, Graph email, and feedback screen.

---

## Project Structure

```
src/
  common/
    Constants.ts          # TIME_CONFIG (submit hours, delete window)
    Interfaces.ts         # ILunchRequest, ICurrentUser, IPersonField
  services/
    SharePointService.ts  # All SharePoint REST calls
    GraphService.ts       # Microsoft Graph email (confirmation)
  webparts/lunchApp/
    components/
      LunchApp.tsx         # Root component — state and business logic
      screens/
        HomeScreen.tsx     # Main UI (submit button, gallery, stats)
        FeedbackScreen.tsx # Feedback entry screen
```

---

## SharePoint Lists Required

### Lunch Request
| Display Name | Internal Name | Type |
|---|---|---|
| Request# | Title | Single line of text |
| Employee | Employee | Person |
| Requested Date | RequestedDate | Date and Time |
| HR Name | HRName | Person |
| Comments | Comments | Multiple lines |
| IndexedID | IndexedID | Number |

### HigherOfficial
| Display Name | Internal Name | Type |
|---|---|---|
| Role | Title | Single line of text |
| FinalApprover | FinalApprover | Person |

Add one row with `Title = HR` and FinalApprover pointing to the HR team member.

---

## Build & Deploy

```bash
npm install
gulp build
gulp bundle --ship
gulp package-solution --ship
```

Upload the `.sppkg` from `sharepoint/solution/` to your App Catalog, then add the web part to a SharePoint page.
