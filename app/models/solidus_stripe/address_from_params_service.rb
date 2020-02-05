# frozen_string_literal: true

module SolidusStripe
  class AddressFromParamsService
    attr_reader :address_params, :user

    def initialize(address_params, user)
      @address_params, @user = address_params, user
    end

    def call
      if user
        user.addresses.find_or_initialize_by(attributes)
      else
        Spree::Address.new(attributes)
      end
    end

    private

    def attributes
      @attributes ||= begin
        default_attributes.tap do |attributes|
          # possibly anonymized attributes:
          phone = address_params[:phone]
          lines = address_params[:addressLine]
          names = address_params[:recipient].split(' ')

          attributes.merge!(state_id: state.id) if state
          attributes.merge!(firstname: names.first) if names.first
          attributes.merge!(lastname: names.last) if names.last
          attributes.merge!(phone: phone) if phone
          attributes.merge!(address1: lines.first) if lines.first
          attributes.merge!(address2: lines.second) if lines.second
        end
      end
    end

    def country
      @country ||= Spree::Country.find_by_iso(address_params[:country])
    end

    def state
      @state ||= country.states.find_by_abbr(address_params[:region])
    end

    def default_attributes
      {
        country_id: country.id,
        city: address_params[:city],
        zipcode: address_params[:postalCode]
      }
    end
  end
end
