# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SolidusStripe::ShippingRatesService do
  let(:service) { described_class.new(order, user, params) }

  let(:order) { create :order }
  let(:user) { Spree::User.new }

  let(:params) do
    {
      country: create(:country).iso,
      city: "Metropolis",
      postalCode: "12345",
      recipient: "",
      addressLine: []
    }
  end

  let(:ups_ground) { create(:shipping_method, cost: 5, available_to_all: false) }
  let(:air_mail) { create(:shipping_method, cost: 8, name: "Air Mail", available_to_all: false) }

  let(:ny_warehouse) { create(:stock_location, shipping_methods: [ups_ground], backorderable_default: false) }
  let(:ca_warehouse) { create(:stock_location, name: "CA Warehouse", shipping_methods: [air_mail], backorderable_default: false) }

  before do
    create :inventory_unit, order: order, stock_location: ny_warehouse
    create :inventory_unit, order: order, stock_location: ca_warehouse
    Spree::StockItem.find_by(stock_location: ny_warehouse, variant: order.variants.first).set_count_on_hand(1)
    Spree::StockItem.find_by(stock_location: ca_warehouse, variant: order.variants.last).set_count_on_hand(1)
  end

  describe "#call" do
    subject { service.call }

    context "when there are no common shipping methods for all order shipments" do
      it "cannot find any shipping rate" do
        expect(subject).to be_empty
      end
    end

    context "when there are common shipping methods for all order shipments" do
      before { ny_warehouse.shipping_methods << ca_warehouse.shipping_methods.first }

      context "when one shipping method is available for all shipments" do
        it "sums the shipping rates for the shared shipping method" do
          expect(subject).to eql [{ amount: 1600, id: air_mail.id.to_s, label: air_mail.name }]
        end
      end
    end
  end
end
