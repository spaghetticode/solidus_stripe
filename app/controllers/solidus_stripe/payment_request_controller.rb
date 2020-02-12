# frozen_string_literal: true

module SolidusStripe
  class PaymentRequestController < Spree::BaseController
    include Spree::Core::ControllerHelpers::Order

    def shipping_rates
      rates = SolidusStripe::ShippingRatesService.new(
        current_order,
        spree_current_user,
        params[:shipping_address]
      ).call

      if rates.any?
        render json: { success: true, shipping_rates: rates }
      else
        render json: { success: false, error: 'No shipping method available for that address' }
      end
    end

    def update_order
      current_order.restart_checkout_flow

      address = SolidusStripe::AddressFromParamsService.new(
        params[:shipping_address],
        spree_current_user
      ).call

      if address.valid?
        SolidusStripe::PrepareOrderForPaymentService.new(address, self).call

        if current_order.payment?
          render json: { success: true }
        else
          render json: { success: false, error: 'Order not ready for payment. Try manual checkout.' }
        end
      else
        render json: { success: false, error: address.errors.full_messages.to_sentence }
      end
    end
  end
end
