DiscourseUserConsent::Engine.routes.draw do
  post "/confirm" => "confirmations#create"
end
