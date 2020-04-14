# frozen_string_literal: true

module SolidusStripe
  class CreateIntentsOrderService
    attr_reader :intent, :stripe, :controller

    delegate :request, :current_order, :params, to: :controller

    def initialize(intent_id, stripe, controller)
      @stripe, @controller = stripe, controller
      @intent = stripe.show_intent(intent_id, {})
    end

    def call
      invalidate_previous_payment_intents_payments

      payment = create_payment
      description = "Solidus Order ID: #{payment.gateway_order_identifier}"
      stripe.update_intent(nil, response['id'], nil, description: description)
    end

    private

    def invalidate_previous_payment_intents_payments
      if stripe.v3_intents?
        current_order.payments.pending.where(payment_method: stripe).each(&:void_transaction!)
      end
    end

    def create_payment
      Spree::OrderUpdateAttributes.new(
        current_order,
        payment_params,
        request_env: request.headers.env
      ).apply

      Spree::Payment.find_by(response_code: response['id']).tap do |payment|
        payment.update!(state: :pending)
      end
    end

    def payment_params
      card = response['charges']['data'][0]['payment_method_details']['card']

      {
        payments_attributes: [{
          payment_method_id: stripe.id,
          amount: current_order.total,
          response_code: response['id'],
          source_attributes: {
            month: card['exp_month'],
            year: card['exp_year'],
            cc_type: card['brand'],
            gateway_payment_profile_id: response['payment_method'],
            last_digits: card['last4'],
            name: address_full_name,
            address_attributes: address_attributes
          }
        }]
      }
    end

    def response
      intent.params
    end

    def form_data
      params[:form_data]
    end

    def address_attributes
      if form_data.is_a?(String)
        data = Rack::Utils.parse_nested_query(form_data)
        data['payment_source'][stripe.id.to_s]['address_attributes']
      else
        SolidusStripe::AddressFromParamsService.new(form_data).call.attributes
      end
    end

    def address_full_name
      current_order.bill_address&.full_name || form_data[:recipient]
    end
  end
end
