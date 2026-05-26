import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { ILunchRequest, IPersonField, ICurrentUser } from '../common/Interfaces';
import { LIST_NAMES } from '../common/Constants';

// All REST calls use odata=nometadata — no __metadata type needed.
const HEADERS_WRITE: Record<string, string> = {
  'Accept': 'application/json;odata=nometadata',
  'Content-type': 'application/json;odata=nometadata',
  'odata-version': '',
};

const HEADERS_MERGE: Record<string, string> = {
  ...HEADERS_WRITE,
  'X-HTTP-Method': 'MERGE',
  'IF-MATCH': '*',
};

const HEADERS_DELETE: Record<string, string> = {
  ...HEADERS_WRITE,
  'X-HTTP-Method': 'DELETE',
  'IF-MATCH': '*',
};

export class SharePointService {
  private context: WebPartContext;
  private siteUrl: string;

  constructor(context: WebPartContext) {
    this.context = context;
    this.siteUrl = context.pageContext.web.absoluteUrl;
  }

  // Parses SharePoint odata error JSON and returns a clean human-readable message.
  private async spError(response: SPHttpClientResponse, label: string): Promise<Error> {
    try {
      const json = await response.json();
      const msg: string =
        json?.['odata.error']?.message?.value ||
        json?.error?.message?.value ||
        json?.error?.message ||
        `HTTP ${response.status}`;
      return new Error(`${label}: ${msg}`);
    } catch {
      return new Error(`${label}: HTTP ${response.status}`);
    }
  }

  // ── Current user ───────────────────────────────────────────────────────────

  public async getCurrentUser(): Promise<ICurrentUser> {
    const url = `${this.siteUrl}/_api/web/currentuser?$select=Id,Title,Email`;
    const response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!response.ok) {
      throw new Error(`getCurrentUser failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      displayName: data.Title,
      email: data.Email,
      spUserId: data.Id,
    };
  }

  // ── HR person from HigherOfficial list ─────────────────────────────────────
  // Internal column names:
  //   Title        → display name "Role"       (filter: Title eq 'HR')
  //   FinalApprover → display name "FinalApprover"

  public async getHRPerson(): Promise<IPersonField | undefined> {
    try {
      const url =
        `${this.siteUrl}/_api/web/lists/getbytitle('${LIST_NAMES.HIGHER_OFFICIAL}')/items` +
        `?$filter=Title eq 'HR'` +
        `&$select=ID,Title,FinalApprover/Title,FinalApprover/EMail,FinalApprover/Id` +
        `&$expand=FinalApprover` +
        `&$top=1`;

      const response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
      if (!response.ok) return undefined;

      const data = await response.json();
      if (data.value && data.value.length > 0 && data.value[0].FinalApprover) {
        return data.value[0].FinalApprover as IPersonField;
      }
    } catch {
      // HR lookup is non-blocking — submission continues without HR Name
    }
    return undefined;
  }

  // ── Lunch requests for current user ───────────────────────────────────────
  // Internal column names:
  //   Title        → display name "Request#"
  //   RequestedDate → display name "Requested Date"
  //   HRName        → display name "HR Name"
  //   IndexedID     → display name "IndexedID"

  public async getLunchRequests(userEmail: string): Promise<ILunchRequest[]> {
    // Do NOT encodeURIComponent the email — it corrupts '@' inside the OData filter.
    const url =
      `${this.siteUrl}/_api/web/lists/getbytitle('${LIST_NAMES.LUNCH_REQUEST}')/items` +
      `?$filter=Employee/EMail eq '${userEmail}'` +
      `&$select=ID,Title,Employee/Title,Employee/EMail,Employee/Id,` +
      `RequestedDate,HRName/Title,HRName/EMail,` +
      `Comments,IndexedID,Created,Modified,Author/Title,Author/EMail` +
      `&$expand=Employee,HRName,Author` +
      `&$orderby=ID desc` +
      `&$top=500`;

    const response = await this.context.spHttpClient.get(url, SPHttpClient.configurations.v1);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.value as ILunchRequest[]) || [];
  }

  // ── Ensure user exists in site and return SP user ID ──────────────────────

  public async ensureUser(email: string): Promise<number> {
    const url = `${this.siteUrl}/_api/web/ensureuser`;
    const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
      headers: HEADERS_WRITE,
      body: JSON.stringify({ logonName: `i:0#.f|membership|${email}` }),
    });
    if (!response.ok) {
      throw new Error(`ensureUser failed for ${email}: ${response.status}`);
    }
    const data = await response.json();
    return data.Id as number;
  }

  // ── Create lunch request ───────────────────────────────────────────────────
  // Correct internal names:
  //   EmployeeId   → Person field (suffix Id for lookup)
  //   RequestedDate → Date column
  //   HRNameId      → Person field (suffix Id for lookup) — optional

  public async submitLunchRequest(
    employeeSpId: number,
    requestedDate: Date,
    hrPersonSpId?: number
  ): Promise<number> {
    const url =
      `${this.siteUrl}/_api/web/lists/getbytitle('${LIST_NAMES.LUNCH_REQUEST}')/items`;

    const body: Record<string, unknown> = {
      EmployeeId: employeeSpId,
      RequestedDate: requestedDate.toISOString(),
      ...(hrPersonSpId ? { HRNameId: hrPersonSpId } : {}),
    };

    const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
      headers: HEADERS_WRITE,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await this.spError(response, 'Submit failed');
    }

    const data = await response.json();
    return data.ID as number;
  }

  // ── Patch Title (Request#) and IndexedID after creation ───────────────────
  // "Title" is the internal name whose display name is "Request#"

  public async updateRequestMeta(id: number): Promise<void> {
    const requestNum = `LUR${('00000' + id).slice(-5)}`;
    const url =
      `${this.siteUrl}/_api/web/lists/getbytitle('${LIST_NAMES.LUNCH_REQUEST}')/items(${id})`;

    const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
      headers: HEADERS_MERGE,
      body: JSON.stringify({ Title: requestNum, IndexedID: id }),
    });

    if (!response.ok && response.status !== 204) {
      throw await this.spError(response, 'Update meta failed');
    }
  }

  // ── Delete a lunch request ─────────────────────────────────────────────────

  public async deleteLunchRequest(id: number): Promise<void> {
    const url =
      `${this.siteUrl}/_api/web/lists/getbytitle('${LIST_NAMES.LUNCH_REQUEST}')/items(${id})`;

    const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
      headers: HEADERS_DELETE,
      body: '',
    });

    if (!response.ok && response.status !== 204) {
      throw await this.spError(response, 'Delete failed');
    }
  }

  // ── Save feedback to Comments column ──────────────────────────────────────

  public async saveFeedback(id: number, comments: string): Promise<void> {
    const url =
      `${this.siteUrl}/_api/web/lists/getbytitle('${LIST_NAMES.LUNCH_REQUEST}')/items(${id})`;

    const response = await this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, {
      headers: HEADERS_MERGE,
      body: JSON.stringify({ Comments: comments }),
    });

    if (!response.ok && response.status !== 204) {
      throw await this.spError(response, 'Save feedback failed');
    }
  }
}
