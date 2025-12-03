# frozen_string_literal: true

module ::DiscourseUserConsent
  class ConfirmationsController < ::ApplicationController
    requires_plugin ::DiscourseUserConsent::PLUGIN_NAME

    before_action :ensure_logged_in

    def create
      raise Discourse::InvalidAccess unless SiteSetting.user_consent_enabled

      DiscourseUserConsent.record_confirmation(current_user)

      render json:
               success_json.merge(
                 confirmed_at:
                   DiscourseUserConsent.confirmed_at(current_user)&.iso8601,
               )
    end
  end
end
