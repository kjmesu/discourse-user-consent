# frozen_string_literal: true

# name: discourse-user-consent
# about: Adds a configurable user consent gate for Discourse sites
# version: 1.0.0
# authors: kjm
# url: https://github.com/kjm/discourse-user-consent

register_asset "stylesheets/common/user-consent.scss"

enabled_site_setting :user_consent_enabled

module ::DiscourseUserConsent
  PLUGIN_NAME = "discourse-user-consent".freeze

  def self.plugin_store
    @plugin_store ||= PluginStore.new(PLUGIN_NAME)
  end

  def self.store_key(user)
    "user:#{user.id}"
  end

  def self.record_confirmation(user, ip_address: nil)
    data = { confirmed_at: Time.zone.now.iso8601 }
    data[:ip_address] = ip_address if ip_address.present? && SiteSetting.user_consent_store_ip
    plugin_store.set(store_key(user), data)
  end

  def self.confirmation(user)
    plugin_store.get(store_key(user))
  end

  def self.confirmed_at(user)
    value = confirmation(user)&.dig("confirmed_at")
    value.present? ? Time.zone.parse(value) : nil
  end
end

require_relative "lib/discourse_user_consent/engine"

after_initialize do
  require_relative "app/controllers/discourse_user_consent/confirmations_controller"

  Discourse::Application.routes.append do
    mount ::DiscourseUserConsent::Engine, at: "/user-consent"
  end

  add_to_serializer(:current_user, :user_consent_confirmed_at) do
    next unless object

    DiscourseUserConsent.confirmed_at(object)&.iso8601
  end
end
