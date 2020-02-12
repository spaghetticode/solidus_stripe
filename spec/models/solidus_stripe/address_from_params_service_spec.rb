# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SolidusStripe::AddressFromParamsService do
  let(:service) { described_class.new(params, user) }
  let(:state) { create :state }

  describe '#call' do
    let(:params) do
      {
        country: state.country.iso,
        region: state.abbr,
        recipient: 'Clark Kent',
        city: 'Metropolis',
        postalCode: '12345',
        addressLine: [ '12, Lincoln Rd']
      }
    end

    subject { service.call }

    context "when there is no user" do
      let(:user) { nil }

      it "returns a non-persisted address model" do
        expect(subject).to be_new_record
      end
    end

    context "when there is a user" do
      let(:user) { create :user }

      context "when the user has an address compatible with the params" do
        before do
          user.addresses << create(
            :address, city: params[:city],
            zipcode: params[:postalCode],
            firstname: 'Clark',
            lastname: 'Kent',
            address1: params[:addressLine].first,
            address2: nil
          )
        end

        it "returns an existing user's address" do
          expect(subject).to eql user.addresses.first
        end
      end

      context "when no user's address is compatible with the params" do
        before do
          user.addresses << create(:address)
        end

        it "returns a non-persisted address model" do
          expect(subject).to be_new_record
        end
      end
    end
  end
end
