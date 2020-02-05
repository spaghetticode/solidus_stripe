# frozen_string_literal: true

module CartCheckoutPaymentMethodDecorator
  def self.prepended(base)
    base.helper_method :cart_checkout_payment_method
  end

  # Override this method in order to enable cart page checkout
  # with Apple Pay and Google Pay. This method must return the
  # `Spree::PaymentMethod::StripeCreditCard` instance that will
  # be used for configuring the payment request button.
  def cart_checkout_payment_method
  end

  Spree::OrdersController.prepend(self)
end
