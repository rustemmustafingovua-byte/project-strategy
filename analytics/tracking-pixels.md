# Tracking Pixels Setup

Instructions for adding analytics tracking pixels and scripts across platforms.

## Google Analytics (GA4)

1. Create a GA4 property in the Google Analytics admin console.
2. Copy the Measurement ID (format: `G-XXXXXXXXXX`).
3. Add the gtag.js snippet to every page's `<head>`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

4. Verify real-time reports before launch.
5. In GA4, configure your domain under Data Streams to avoid referral exclusions.

## Plausible

1. Sign up at plausible.io and add your domain.
2. Copy the provided script snippet:

```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

3. Place it before `</head>` or at the end of `<body>`.
4. For SPAs, ensure pageviews fire on route change (Plausible handles this automatically with the script tag).
5. Enable custom events for signup, login, and upgrade actions.

## Mixpanel

1. Create a Mixpanel project and copy the token.
2. Add the snippet:

```html
<script type="text/javascript">
  (function(f,b){if(!b.__SV){var e,g,i,h;window.mixpanel=b;
  b._i=[];b.init=function(e,f,c){function g(a,d){var b=d.split(".");2==b.length&&
  (a=a[b[0]],d=b[1]);a[d]=function(){a.push([d].concat(Array.prototype.slice.call(arguments,0)))}}var a=b("lib");
  a("init",e,f,c);a("track",g);a("track_links",g);a("track_forms",g);a("pageview",g);
  i=f.createElement("script");i.type="text/javascript";i.async=!0;
  i.src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";h=f.getElementsByTagName("script")[0];
  h.parentNode.insertBefore(i,h)}};
  })(document,window.mixpanel||[]);
  mixpanel.init("YOUR_TOKEN", {track_pageview: true, persistence: 'localStorage'});
</script>
```

3. Replace `YOUR_TOKEN` with your project token.
4. Verify with Mixpanel's debugger.
5. Set up identity merge if users can authenticate across devices.

## Privacy & Compliance

- Always load scripts async/defer where possible.
- Do not set cookies before consent if operating under GDPR/CCPA.
- Exclude internal traffic via IP filters (GA4) or by using `localStorage` opt-out.
- Document what each tracker collects in your privacy policy.

## Verification Checklist

- [ ] GA4 real-time shows active users.
- [ ] Plausible dashboard shows pageviews within minutes.
- [ ] Mixpanel Live View shows events firing.
- [ ] No console errors on any platform (desktop, mobile).
- [ ] Referral exclusions configured so your own domains don't inflate traffic.
- [ ] Conversion goals set up for signup, upgrade, and invite events.
