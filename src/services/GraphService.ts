import { WebPartContext } from '@microsoft/sp-webpart-base';
import { MSGraphClientV3 } from '@microsoft/sp-http';

export class GraphService {
  private context: WebPartContext;

  constructor(context: WebPartContext) {
    this.context = context;
  }

  private async getClient(): Promise<MSGraphClientV3> {
    return this.context.msGraphClientFactory.getClient('3');
  }

  public async sendConfirmationEmail(
    toEmail: string,
    toName: string,
    requestNum: string,
    requestedDate: Date,
    hrName: string
  ): Promise<void> {
    const client = await this.getClient();
    const dateStr = requestedDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const year = new Date().getFullYear();

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#eef2f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 8px 40px rgba(0,0,0,0.12);max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1976d2;background:linear-gradient(135deg,#0d47a1 0%,#1976d2 60%,#42a5f5 100%);
                       padding:40px 30px 30px;text-align:center;">
              <div style="font-size:34px;font-weight:900;color:#ffffff;
                          letter-spacing:-1px;margin-bottom:6px;">
                vee<span style="color:#ffcc00;">lead</span>
              </div>
              <div style="font-size:24px;color:#ffffff;font-weight:700;margin:12px 0 4px;">
                &#127860; Lunch Request Confirmed!
              </div>
              <div style="color:rgba(255,255,255,0.8);font-size:14px;">
                Your request has been successfully submitted
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 30px 24px;">
              <p style="font-size:16px;color:#222;margin:0 0 16px;">
                Dear <strong>${toName}</strong>,
              </p>
              <p style="color:#555;line-height:1.7;margin:0 0 28px;font-size:15px;">
                Your lunch request has been
                <strong style="color:#2e7d32;">successfully registered</strong>.
                Please review the details below:
              </p>

              <!-- Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f5f8ff;border:2px solid #dce8ff;
                       border-radius:12px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="padding:6px 0;">
                    <table width="100%" cellpadding="12" cellspacing="0">
                      <tr style="border-bottom:1px solid #e8eeff;">
                        <td width="150"
                          style="color:#607d8b;font-weight:700;font-size:13px;
                                 padding-left:24px;">
                          &#128203; Request ID
                        </td>
                        <td style="color:#1565c0;font-weight:800;font-size:16px;">
                          ${requestNum}
                        </td>
                      </tr>
                      <tr style="background:rgba(0,0,0,0.02);border-bottom:1px solid #e8eeff;">
                        <td style="color:#607d8b;font-weight:700;font-size:13px;padding-left:24px;">
                          &#128197; Lunch Date
                        </td>
                        <td style="color:#333;font-size:14px;">${dateStr}</td>
                      </tr>
                      <tr style="border-bottom:1px solid #e8eeff;">
                        <td style="color:#607d8b;font-weight:700;font-size:13px;padding-left:24px;">
                          &#128100; HR Contact
                        </td>
                        <td style="color:#333;font-size:14px;">${hrName}</td>
                      </tr>
                      <tr style="background:rgba(0,0,0,0.02);">
                        <td style="color:#607d8b;font-weight:700;font-size:13px;padding-left:24px;">
                          &#9989; Status
                        </td>
                        <td>
                          <span style="background:#e8f5e9;color:#2e7d32;
                                       padding:5px 14px;border-radius:20px;
                                       font-weight:700;font-size:13px;">
                            Submitted
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info Banner -->
              <div style="background:#fff8e1;border-left:4px solid #ffa000;
                          border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:24px;">
                <strong style="color:#e65100;">&#9888;&#65039; Note: </strong>
                <span style="color:#555;font-size:14px;">
                  If you need to cancel, please delete your request through the
                  Lunch Request App before the deadline.
                </span>
              </div>

              <p style="color:#9e9e9e;font-size:12px;line-height:1.6;margin:0;">
                This is an automated confirmation from the
                <strong>Veelead Lunch Request System</strong>.
                Please do not reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f5;padding:16px 30px;
                       text-align:center;border-top:1px solid #eeeeee;">
              <p style="margin:0;color:#bdbdbd;font-size:12px;">
                &copy; ${year} Veelead Solutions. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await client.api('/me/sendMail').post({
      message: {
        subject: `Lunch Request Confirmed — ${requestNum}`,
        body: {
          contentType: 'HTML',
          content: emailHtml,
        },
        toRecipients: [
          {
            emailAddress: {
              address: toEmail,
              name: toName,
            },
          },
        ],
      },
      saveToSentItems: false,
    });
  }
}
