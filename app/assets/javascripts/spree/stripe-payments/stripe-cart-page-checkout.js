Spree.StripeCartPageCheckout = function() {
  Spree.StripePayment.call(this);

  this.errorElement = $('#card-errors');
};

Spree.StripeCartPageCheckout.prototype = Object.create(Spree.StripePayment.prototype);
Object.defineProperty(Spree.StripeCartPageCheckout.prototype, 'constructor', {
  value: Spree.StripeCartPageCheckout,
  enumerable: false,
  writable: true
});

Spree.StripeCartPageCheckout.prototype.init = function() {
  this.setUpPaymentRequest({requestShipping: true});
};

Spree.StripeCartPageCheckout.prototype.showError = function(error) {
  this.errorElement.text(error).show();
};

Spree.StripeCartPageCheckout.prototype.submitPayment = function(payment) {
  $.ajax({
    url: $('[data-submit-url]').data('submit-url'),
    headers: {
      'X-Spree-Order-Token': $('[data-order-token]').data('order-token')
    },
    type: 'PATCH',
    contentType: 'application/json',
    data: JSON.stringify(this.prTokenHandler(payment.paymentMethod)),
    success: function() {
      window.location = $('[data-complete-url]').data('complete-url');
    },
    error: function(xhr,status,error) {
      this.showError(xhr.responseJSON.error);
    }
  });
};

Spree.StripeCartPageCheckout.prototype.onPrPayment = function(result) {
  var handleServerResponse = this.handleServerResponse.bind(this);

  fetch('/stripe/update_order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shipping_address: result.shippingAddress,
      shipping_option: result.shippingOption,
      email: result.payerEmail,
      name: result.payerName,
      authenticity_token: this.authToken
    })
  }).then(function(response) {
    response.json().then(function(json) {
      handleServerResponse(json, result);
    })
  });
};

Spree.StripeCartPageCheckout.prototype.onPrButtonMounted = function(buttonId, success) {
  var container = document.getElementById('stripe-payment-request');

  if (success) {
    container.style.display = '';
  } else {
    container.style.display = 'none';
  }
};

Spree.StripeCartPageCheckout.prototype.prTokenHandler = function(token) {
  return {
    order: {
      payments_attributes: [
        {
          payment_method_id: this.config.id,
          source_attributes: {
            gateway_payment_profile_id: token.id,
            last_digits: token.card.last4,
            month: token.card.exp_month,
            year: token.card.exp_year
          }
        }
      ]
    }
  }
};
