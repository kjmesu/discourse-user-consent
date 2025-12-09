import Service, { service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";
import { i18n } from "discourse-i18n";
import UserConsentModal from "../components/modal/user-consent";

const STORAGE_KEY = "discourse-user-consent-confirmed";
const MS_IN_DAY = 86_400_000;

export default class UserConsentService extends Service {
  @service currentUser;
  @service modal;
  @service router;
  @service siteSettings;

  @tracked errorMessage = null;
  @tracked isProcessing = false;

  #modalPromise = null;

  async maybePrompt() {
    if (!this.siteSettings.user_consent_enabled) {
      this.#closeModalIfOpen();
      return;
    }

    if (this.#isAdminRoute()) {
      this.#closeModalIfOpen();
      return;
    }

    if (this.currentUser && this.#sessionConfirmed()) {
      await this.migrateAnonymousConsent();
    }

    if (this.#needsConfirmation()) {
      this.#showModal();
    } else {
      this.#closeModalIfOpen();
    }
  }

  async confirm() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = null;

    try {
      if (this.currentUser) {
        const response = await ajax("/user-consent/confirm", {
          type: "POST",
        });

        const confirmedAt =
          response?.confirmed_at ?? new Date().toISOString();

        if (typeof this.currentUser.set === "function") {
          this.currentUser.set(
            "user_consent_confirmed_at",
            confirmedAt
          );
        } else {
          this.currentUser.user_consent_confirmed_at = confirmedAt;
        }
      } else {
        this.#markSessionConfirmed();
      }

      this.#closeModalIfOpen();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("user consent confirmation failed", error);
      this.errorMessage = i18n("user_consent.confirmation_failed");
    } finally {
      this.isProcessing = false;
    }
  }

  decline() {
    const fallbackPath = "/";
    const redirect = this.siteSettings.user_consent_redirect_url?.trim();

    window.location.href = redirect || fallbackPath;
  }

  async migrateAnonymousConsent() {
    // eslint-disable-next-line no-console
    console.log("migrateAnonymousConsent called", {
      hasCurrentUser: !!this.currentUser,
      hasDbConsent: !!this.currentUser?.user_consent_confirmed_at,
      hasLocalStorage: this.#sessionConfirmed(),
      isProcessing: this.isProcessing,
    });

    if (!this.currentUser) {
      return false;
    }

    if (this.currentUser.user_consent_confirmed_at) {
      this.#clearSessionConfirmation();
      return false;
    }

    if (!this.#sessionConfirmed()) {
      return false;
    }

    if (this.isProcessing) {
      return false;
    }

    this.isProcessing = true;

    try {
      const response = await ajax("/user-consent/confirm", {
        type: "POST",
      });

      const confirmedAt =
        response?.confirmed_at ?? new Date().toISOString();

      if (typeof this.currentUser.set === "function") {
        this.currentUser.set("user_consent_confirmed_at", confirmedAt);
      } else {
        this.currentUser.user_consent_confirmed_at = confirmedAt;
      }

      this.#clearSessionConfirmation();

      // eslint-disable-next-line no-console
      console.log("user consent migrated from anonymous to authenticated");

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("user consent migration failed", error);
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  #needsConfirmation() {
    if (!this.siteSettings.user_consent_enabled) {
      return false;
    }

    if (this.currentUser) {
      const confirmedAt = this.currentUser.user_consent_confirmed_at;

      if (!confirmedAt) {
        return true;
      }

      const confirmedTime = Date.parse(confirmedAt);

      if (Number.isNaN(confirmedTime)) {
        return true;
      }

      const reaffirmDays = Number(
        this.siteSettings.user_consent_reaffirm_days
      );

      if (!reaffirmDays || reaffirmDays <= 0) {
        return false;
      }

      const expiresAt = confirmedTime + reaffirmDays * MS_IN_DAY;

      return Date.now() >= expiresAt;
    }

    return !this.#sessionConfirmed();
  }

  #sessionConfirmed() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  #markSessionConfirmed() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch (error) {
      // ignore, session storage is unavailable
    }
  }

  #clearSessionConfirmation() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // ignore
    }
  }

  #showModal() {
    if (this.#modalPromise) {
      return;
    }

    this.#setBackdropBlur(true);

    this.#modalPromise = this.modal
      .show(UserConsentModal)
      .finally(() => {
        this.#modalPromise = null;
        this.errorMessage = null;
        this.#setBackdropBlur(false);
      });
  }

  #closeModalIfOpen() {
    if (this.#modalPromise) {
      this.modal.close();
      this.#setBackdropBlur(false);
    }
  }

  #setBackdropBlur(enabled) {
    document.documentElement.classList.toggle(
      "user-consent-blur",
      enabled
    );
  }

  #isAdminRoute() {
    // Check URL first - most reliable method for admin routes
    if (window.location.pathname.startsWith("/admin")) {
      return true;
    }

    // Also check route name for consistency
    const routeName = this.router.currentRouteName;
    return routeName?.startsWith("admin") ?? false;
  }
}
