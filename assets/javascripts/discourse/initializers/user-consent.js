import { withPluginApi } from "discourse/lib/plugin-api";

const MIN_PLUGIN_API_VERSION = "1.44.0";

export default {
  name: "user-consent",

  initialize() {
    withPluginApi(MIN_PLUGIN_API_VERSION, (api) => {
      const userConsentService = api.container.lookup(
        "service:user-consent"
      );

      if (!userConsentService) {
        return;
      }

      userConsentService.maybePrompt();

      api.onPageChange(() => userConsentService.maybePrompt());
      api.onAppEvent("current-user:changed", () =>
        userConsentService.maybePrompt()
      );
    });
  },
};
