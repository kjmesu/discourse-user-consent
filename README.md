# Discourse User Consent Plugin

A configurable user consent gate for Discourse sites that requires visitors to confirm their consent before accessing content.

## Features

- **Mandatory Consent Dialog**: Displays a customizable modal dialog to users who haven't consented
- **Flexible Configuration**: Fully customizable dialog content, button labels, and redirect URLs
- **Session Persistence**: Remembers consent for anonymous users during their session
- **User Tracking**: Stores consent confirmations for logged-in users with timestamp tracking
- **Periodic Reaffirmation**: Optionally require users to reconfirm consent after a specified number of days
- **Optional Checkbox**: Add an additional checkbox requirement for explicit acknowledgment
- **Admin Bypass**: Automatically skips consent dialog on admin routes
- **Background Blur**: Adds visual emphasis by blurring content behind the modal

## Installation

1. Navigate to your Discourse installation directory
2. Add the plugin to your `containers/app.yml` file:

```yaml
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - git clone https://github.com/kjm/discourse-user-consent.git
```

3. Rebuild your Discourse container:

```bash
cd /var/discourse
./launcher rebuild app
```

## Configuration

After installation, enable and configure the plugin in your Discourse admin panel at **Settings > Plugins > User consent**.

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `user_consent_enabled` | Boolean | `false` | Enable the user consent feature |
| `user_consent_dialog_title` | String | `"User consent"` | Title displayed in the consent modal |
| `user_consent_dialog_body` | Text | `"This community requires your consent to continue..."` | Body text shown in the consent modal (supports markdown) |
| `user_consent_confirm_button_label` | String | `"I agree"` | Label for the confirmation button |
| `user_consent_decline_button_label` | String | `"I decline"` | Label for the decline button |
| `user_consent_redirect_url` | URL | `"https://www.example.com/"` | URL to redirect users who decline consent |
| `user_consent_reaffirm_days` | Number | `90` | Number of days before logged-in users must re-affirm consent (minimum: 1) |
| `user_consent_require_checkbox` | Boolean | `false` | Require users to check a checkbox before confirming |
| `user_consent_checkbox_label` | String | `"I have read and understood the above"` | Label for the optional checkbox |
| `user_consent_store_ip` | Boolean | `false` | Store the user's IP address when they accept consent |

## Usage

### Basic Setup

1. Go to **Admin > Settings > Plugins**
2. Find **discourse-user-consent** in the plugin list
3. Enable `user_consent_enabled`
4. Customize the dialog title and body text to match your requirements
5. Set the `user_consent_redirect_url` to a page where declined users should be sent
6. Save your changes

### Example Configuration

For a GDPR compliance notice:

- **Dialog Title**: `"Privacy Notice"`
- **Dialog Body**: `"By continuing to use this site, you consent to our use of cookies and data processing as described in our Privacy Policy."`
- **Confirm Button**: `"I Accept"`
- **Decline Button**: `"Decline"`
- **Redirect URL**: `"https://yoursite.com/privacy-declined"`
- **Reaffirm Days**: `365`

### Advanced Options

#### Requiring Explicit Acknowledgment

Enable `user_consent_require_checkbox` to add a checkbox that users must check before they can confirm their consent. This provides an additional layer of explicit agreement.

#### Storing IP Addresses

Enable `user_consent_store_ip` to record the user's IP address at the time they accept consent. This can be useful for:
- Compliance auditing and legal requirements
- Fraud detection and security monitoring
- Geographic consent tracking

**Privacy Note**: Storing IP addresses is considered personal data under many privacy regulations (GDPR, CCPA, etc.). Ensure you have a legal basis for collecting and storing this information, and that your privacy policy discloses this practice.

The IP address is stored alongside the consent timestamp in the plugin's data store and is only collected for logged-in users when they explicitly accept the consent dialog.

#### Periodic Reaffirmation

Set `user_consent_reaffirm_days` to a positive number to require logged-in users to reconfirm their consent periodically. Set to `0` or leave empty to only require consent once.

## How It Works

### For Anonymous Users

- Consent is stored in the browser's session storage
- Lasts for the duration of the browser session
- Users must re-consent after closing and reopening the browser

### For Logged-In Users

- Consent is stored in the Discourse database via PluginStore
- Includes a timestamp of when consent was given
- Optionally includes the IP address (if `user_consent_store_ip` is enabled)
- Persists across sessions and devices
- Can be configured to expire after a set number of days

### Technical Details

The plugin:
- Checks for consent on every page load and route change
- Bypasses the consent check for admin routes
- Stores consent data using Discourse's PluginStore API
- Provides a REST endpoint at `/user-consent/confirm` for recording confirmations
- Integrates with Discourse's modal system for a native look and feel

## Development

### API Endpoints

**POST** `/user-consent/confirm`
- Records user consent confirmation
- Requires authentication
- Returns: `{ success: true, confirmed_at: "ISO8601 timestamp" }`

## License

This plugin is provided as-is for use with Discourse installations.

## Support

For issues, questions, or feature requests, please visit:
https://github.com/kjm/discourse-user-consent/issues

## Version

**1.0.0** - Initial release
