# frozen_string_literal: true

module SolidusStripe
  class PrepareOrderForPaymentService
    attr_reader :order, :address, :user, :email

    def initialize(address, controller)
      @address = address
      @order = controller.current_order
      @user = controller.spree_current_user
      @email = controller.params[:email]
    end

    def call
      set_order_addresses
      manage_guest_checkout
      advance_order_to_payment_state
    end

    private

    def set_order_addresses
      order.ship_address = address
      order.bill_address ||= address
    end

    def manage_guest_checkout
      order.email = email unless user
    end

    def advance_order_to_payment_state
      while !order.payment?
        order.next || break
      end
    end
  end
end
