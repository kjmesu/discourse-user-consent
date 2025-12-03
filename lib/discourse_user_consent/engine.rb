# frozen_string_literal: true

module ::DiscourseUserConsent
  class Engine < ::Rails::Engine
    engine_name "discourse_user_consent"
    isolate_namespace DiscourseUserConsent
  end
end
