# Conversion Tracking Setup

How to track email signups and key conversions across platforms.

## Events to Track

Define these standard events and send them to every analytics provider:

- `page_view` — auto-fired on navigation
- `signup` — user submits email/creates account
- `login` — authenticated session starts
- `demo_request` — user requests a demo or trial
- `upgrade` — user moves to paid plan
- `invite_sent` — user shares an invite link
- `onboarding_complete` — user finishes setup wizard
- `support_click` — user opens support/chat

## Implementation

### GA4

Use `gtag('event', ...)` for custom events:

```html
<button onclick="gtag('event', 'signup', { method: 'email' });">
  Sign up
</button>
```

For SPAs, fire events on route transitions and after async actions complete.

### Plausible

Plausible auto-tracks pageviews. For custom events:

```html
<script>
  plausible('signup', { props: { method: 'email' } });
</script>
```

### Mixpanel

```html
<script>
  mixpanel.track('Sign Up', { method: 'email', plan: 'free' });
</script>
```

## Email-Specific Tracking

### Signup Source Attribution

Append UTM parameters to the signup form action or capture them in JS before POST:

```js
const params = new URLSearchParams(window.location.search);
const form = document.querySelector('#signup-form');
form.addEventListener('submit', () => {
  const utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(k => {
    if (params.has(k)) utm[k] = params.get(k);
  });
  // send utm alongside email to backend
});
```

### Confirmation Page

After successful signup, redirect to `/welcome?signup=success` and fire:

```js
gtag('event', 'signup', { method: 'email', confirmed: true });
plausible('signup', { props: { method: 'email' } });
mixpanel.track('Sign Up', { method: 'email', confirmed: true });
```

## Platform-Level Conversion Windows

| Platform | Typical Conversion Window | Tracking Method |
|----------|---------------------------|-----------------|
| Reddit   | 7 days                   | UTM + GA4 sessions |
| Twitter  | 3 days                   | UTM + short-link redirects |
| HN       | 14 days                  | UTM + referrer fallback |
| LinkedIn | 30 days                  | UTM + company-page visits |

## Verification Steps

1. Open GA4 DebugView and perform a test signup — confirm `signup` event appears within seconds.
2. Check Plausible Real-Time and look for `signup` under custom events.
3. In Mixpanel Live View, filter by event name and verify properties match schema.
4. Ensure no duplicate pageviews on SPAs (use `gtag('config', ..., {page_path: ...})` on route change).
5. Test with ad blockers disabled and enabled to confirm graceful degradation.
