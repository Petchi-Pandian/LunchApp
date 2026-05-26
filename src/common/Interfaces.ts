export interface ILunchRequest {
  ID: number;
  Title: string;          // internal name "Title", display name "Request#"
  EmployeeId: number;
  Employee: IPersonField;
  RequestedDate: string;  // internal name "RequestedDate", display name "Requested Date"
  HRNameId: number;       // internal name "HRNameId", display name "HR Name"
  HRName: IPersonField;   // internal name "HRName",   display name "HR Name"
  Comments: string;
  IndexedID: number;      // internal name "IndexedID", display name "IndexedID"
  Created: string;
  Modified: string;
  Author: IPersonField;
}

export interface IPersonField {
  Id?: number;
  Title?: string;
  EMail?: string;
  LoginName?: string;
}

export interface ICurrentUser {
  displayName: string;
  email: string;
  spUserId: number;
}
