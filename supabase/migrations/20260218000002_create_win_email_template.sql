-- Win notification email template
-- Used by check-wins edge function to email pool members when a win is detected.
-- Variables: pool_name, prize_tier, prize_amount, per_member_share, draw_date

INSERT INTO public.email_templates (name, subject, html_body, variables, description) VALUES
(
  'win_notification',
  'Your pool won ${{prize_amount}}!',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#EDF6F9;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:#006D77;padding:24px 32px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">Shane''s Fund</h1>
      </div>
      <div style="padding:32px;text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">&#127942;</div>
        <h2 style="margin:0 0 8px;color:#006D77;font-size:24px;font-weight:800;">Winner!</h2>
        <p style="margin:0 0 24px;color:#83C5BE;font-size:14px;">Your pool has a winning ticket</p>
        <div style="background:#EDF6F9;border-radius:12px;padding:24px;margin:0 0 24px;">
          <p style="margin:0 0 4px;color:#83C5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Pool</p>
          <p style="margin:0 0 16px;color:#006D77;font-size:18px;font-weight:700;">{{pool_name}}</p>
          <p style="margin:0 0 4px;color:#83C5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Total Prize</p>
          <p style="margin:0 0 16px;color:#10B981;font-size:32px;font-weight:800;">${{prize_amount}}</p>
          <p style="margin:0 0 4px;color:#83C5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Share</p>
          <p style="margin:0 0 16px;color:#006D77;font-size:20px;font-weight:700;">${{per_member_share}}</p>
          <p style="margin:0 0 4px;color:#83C5BE;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Matched</p>
          <p style="margin:0;color:#006D77;font-size:14px;">{{prize_tier}}</p>
        </div>
        <p style="margin:0 0 16px;color:#666;font-size:13px;">Draw date: {{draw_date}}</p>
        <a href="https://shanesfund.vercel.app" style="display:inline-block;background:#006D77;color:#fff;padding:12px 32px;border-radius:24px;text-decoration:none;font-size:14px;font-weight:600;">View in App</a>
      </div>
      <div style="background:#F2E9D4;padding:16px 32px;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">Shane''s Fund &bull; Pool your luck together</p>
      </div>
    </div>
  </div>
</body>
</html>',
  ARRAY['pool_name', 'prize_tier', 'prize_amount', 'per_member_share', 'draw_date'],
  'Sent to pool members when a winning ticket is detected by the automated check'
);
