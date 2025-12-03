import Component from "@glimmer/component";
import { Input } from "@ember/component";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { cook } from "discourse/lib/text";
import htmlSafe from "discourse/helpers/html-safe";
import DButton from "discourse/components/d-button";
import DModal from "discourse/components/d-modal";

export default class UserConsentModal extends Component {
  @service("user-consent") userConsent;
  @service siteSettings;
  @tracked cookedTitle = "";
  @tracked cookedBody = "";
  @tracked checkboxChecked = false;

  constructor() {
    super(...arguments);
    this.loadCookedContent();
  }

  get titleRaw() {
    return this.siteSettings.user_consent_dialog_title || "";
  }

  get bodyRaw() {
    return this.siteSettings.user_consent_dialog_body || "";
  }

  get confirmLabel() {
    return this.siteSettings.user_consent_confirm_button_label;
  }

  get declineLabel() {
    return this.siteSettings.user_consent_decline_button_label;
  }

  get requireCheckbox() {
    return this.siteSettings.user_consent_require_checkbox;
  }

  get checkboxLabel() {
    return this.siteSettings.user_consent_checkbox_label;
  }

  get confirmButtonDisabled() {
    if (this.userConsent.isProcessing) {
      return true;
    }
    if (this.requireCheckbox && !this.checkboxChecked) {
      return true;
    }
    return false;
  }

  @action
  confirm() {
    return this.userConsent.confirm();
  }

  @action
  decline() {
    this.userConsent.decline();
  }

  @action
  async loadCookedContent() {
    const [title, body] = await Promise.all([
      cook(this.titleRaw, { inline: true }),
      cook(this.bodyRaw),
    ]);

    this.cookedTitle = htmlSafe(title);
    this.cookedBody = htmlSafe(body);
  }

  <template>
    <DModal
      @closeModal={{@closeModal}}
      @dismissable={{false}}
      @flash={{this.userConsent.errorMessage}}
      @flashType="error"
      class="user-consent-modal"
    >
      <:headerAboveTitle>
        <div class="user-consent-modal__header">
          <h4>{{this.cookedTitle}}</h4>
        </div>
      </:headerAboveTitle>

      <:body>
        <div class="user-consent-modal__body">
          {{this.cookedBody}}
        </div>
      </:body>

      <:footer>
        {{#if this.requireCheckbox}}
          <div class="user-consent-modal__checkbox">
            <label class="checkbox-label">
              <Input
                @type="checkbox"
                @checked={{this.checkboxChecked}}
              />
              {{this.checkboxLabel}}
            </label>
          </div>
        {{/if}}

        <div class="user-consent-modal__actions">
          <DButton
            @translatedLabel={{this.confirmLabel}}
            @action={{this.confirm}}
            @disabled={{this.confirmButtonDisabled}}
            class="btn-primary"
          />

          <DButton
            @translatedLabel={{this.declineLabel}}
            @action={{this.decline}}
            class="btn-danger"
          />
        </div>
      </:footer>
    </DModal>
  </template>
}
