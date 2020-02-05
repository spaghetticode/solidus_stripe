Spree::Core::Engine.routes.draw do
  post '/stripe/confirm_intents', to: '/solidus_stripe/intents#confirm'
  post '/stripe/shipping_rates', to: '/solidus_stripe/payment_request#shipping_rates'
  post '/stripe/order_update', to: '/solidus_stripe/payment_request#update_order'
end
