// Shared code between Payment Intents and Payment Request Button on cart page

(function() {
  var PaymentRequestButtonShared;

  PaymentRequestButtonShared = {
    authToken: $('meta[name="csrf-token"]').attr('content'),

    setUpPaymentRequest: function(opts) {
      var opts = opts || {};
      var config = this.config.payment_request;

      if (config) {
        config.requestShipping = opts.requestShipping || false;

        var paymentRequest = this.stripe.paymentRequest({
          country: config.country,
          currency: config.currency,
          total: {
            label: config.label,
            amount: config.amount
          },
          requestPayerName: true,
          requestPayerEmail: true,
          requestShipping: config.requestShipping,
          shippingOptions: []
        });

        var prButton = this.elements.create('paymentRequestButton', {
          paymentRequest: paymentRequest
        });

        var onButtonMount = function(result) {
          var id = 'payment-request-button';

          if (result) {
            prButton.mount('#' + id);
          } else {
            document.getElementById(id).style.display = 'none';
          }
          if (typeof this.onPrButtonMounted === 'function') {
            this.onPrButtonMounted(id, result);
          }
        }
        paymentRequest.canMakePayment().then(onButtonMount.bind(this));

        var onPrPaymentMethod = function(result) {
          this.errorElement.text('').hide();
          this.onPrPayment(result);
        };
        paymentRequest.on('paymentmethod', onPrPaymentMethod.bind(this));

        onShippingAddressChange = function(ev) {
          var showError = this.showError.bind(this);

          fetch('/stripe/shipping_rates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              authenticity_token: this.authToken,
              shipping_address: ev.shippingAddress
            })
          }).then(function(response) {
            return response.json();
          }).then(function(result) {
            if (result.error) {
              showError(result.error);
              return false;
            } else {
              ev.updateWith({
                status: 'success',
                shippingOptions: result.shipping_rates
              });
            }
          });
        };
        paymentRequest.on('shippingaddresschange', onShippingAddressChange.bind(this));
      }
    },

    handleServerResponse: function(response, payment) {
      if (response.error) {
        this.showError(response.error);
        this.completePaymentRequest(payment, 'fail');
      } else if (response.requires_action) {
        this.stripe.handleCardAction(
          response.stripe_payment_intent_client_secret
        ).then(this.onIntentsClientSecret.bind(this));
      } else {
        this.completePaymentRequest(payment, 'success');
        this.submitPayment(payment);
      }
    },

    onIntentsClientSecret: function(result) {
      if (result.error) {
        this.showError(result.error);
      } else {
        fetch('/stripe/confirm_intents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spree_payment_method_id: this.config.id,
            stripe_payment_intent_id: result.paymentIntent.id,
            authenticity_token: this.authToken
          })
        }).then(function(confirmResult) {
          return confirmResult.json();
        }).then(this.handleServerResponse.bind(this));
      }
    },

    completePaymentRequest: function(payment, state) {
      if (payment && typeof payment.complete === 'function') {
        payment.complete(state);
      }
    }
  };

  Object.assign(Spree.StripePaymentIntents.prototype, PaymentRequestButtonShared);
  Object.assign(Spree.StripeCartPageCheckout.prototype, PaymentRequestButtonShared);
})()
