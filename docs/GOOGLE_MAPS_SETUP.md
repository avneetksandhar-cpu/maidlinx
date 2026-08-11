# Google Maps Places setup (MaidLinx)

Optional but recommended: enables address autocomplete on `/book/address`. Without a key, customers can still type addresses manually.

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Use project **`maidlinx-505202`** (Maps key + APIs live here as of 2026-08-10). Prefer this over legacy `maidlinx` (Firebase residue, no Maps setup).
3. **Billing must be enabled** on that project — Places returns `BillingNotEnabledMapError` / `REQUEST_DENIED` until it is.  
   Enable here: [Billing for maidlinx-505202](https://console.cloud.google.com/billing/enable?project=maidlinx-505202)  
   (Requires your Google account billing / payment method / legal acceptance — do this in Console, not in chat.)

## 2. Enable APIs

In **APIs & Services → Library**, enable:

- **Places API**
- **Maps JavaScript API**
- **Geocoding API** (required for **Use current location** reverse lookup)

## 3. Create an API key

1. Go to **APIs & Services → Credentials → Create credentials → API key**.
2. Copy the key (you will paste it locally next).
3. For first local test, you can leave the key unrestricted briefly, then restrict it (step 6).

## 4. Put the key in `.env.local`

1. Open `/Users/avnee/website/.env.local` (never commit this file).
2. Find:

   ```bash
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
   ```

3. Paste your key after `=` (no quotes needed). An empty value (`KEY=`) means autocomplete stays off.
4. Save the file.

See also `.env.example` for the documented placeholder and comments.

Without a non-empty key, the booking UI still shows a normal address form (manual entry). Config issues are logged in the **development** browser console only — not as a customer-facing banner.

## 5. Restart the Next.js dev server

`NEXT_PUBLIC_*` values are read at startup. After saving the key:

```bash
# stop whatever is on port 3001, then:
npm run dev
```

Dev URL: [http://localhost:3001](http://localhost:3001)

## 6. Test autocomplete

1. Open [http://localhost:3001/book/address](http://localhost:3001/book/address).
2. Type **`100 King St W`** (Toronto).
3. You should see Places suggestions; pick one and confirm fields fill in.

If suggestions fail: confirm Places + Maps JavaScript API are enabled, billing is on, the key is saved in `.env.local`, and the server was restarted after the paste.

## 6b. Test current location

1. Open [http://localhost:3001/book/address](http://localhost:3001/book/address) (or the homepage address field).
2. Click **Use current location** (also listed under Quick picks when the field is focused and empty).
3. Allow location when the browser prompts you.
4. Confirm street / city / region / postal fill in, and booking state keeps lat/lng.

Notes:

- Browser geolocation requires a **secure context**: `https://…` or `http://localhost` / `http://127.0.0.1`. Plain HTTP on a LAN IP often fails.
- If reverse lookup fails with a key that already works for autocomplete, enable **Geocoding API** and include it under the key’s API restrictions.
- Permission denied / timeout / unavailable show short customer messages — not raw Google/API errors.

## 7. Restrict the key (do this after it works)

In Cloud Console → **Credentials → your key**:

1. **Application restrictions → HTTP referrers**, for example:
   - `http://localhost:3001/*`
   - `http://127.0.0.1:3001/*`
   - your production domain(s), e.g. `https://maidlinx.com/*`
2. **API restrictions → Restrict key** to:
   - Places API
   - Maps JavaScript API
   - Geocoding API

This is a browser (`NEXT_PUBLIC_`) key — treat referrer + API restrictions as required for production.
