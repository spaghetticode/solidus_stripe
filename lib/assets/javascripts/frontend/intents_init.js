function setUpPaymentRequest(config) {
  if (typeof config != 'undefined') {
    var paymentRequest = stripe.paymentRequest({
      country: config.country,
      currency: config.currency,
      total: {
        label: config.label,
        amount: config.amount
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: config.requestShipping,
      shippingOptions: [
      ]
    });

    var prButton = elements.create('paymentRequestButton', {
      paymentRequest: paymentRequest
    });

    paymentRequest.canMakePayment().then(function(result) {
      if (result) {
        prButton.mount('#payment-request-button');
      } else {
        document.getElementById('payment-request-button').style.display = 'none';
      }
    });

    paymentRequest.on('paymentmethod', function(result) {
      Spree.stripePaymentMethod.errorElement.text('').hide();
      handlePayment(result);
    });

    paymentRequest.on('shippingaddresschange', function(ev) {
      fetch('/stripe/shipping_rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authenticity_token: Spree.stripePaymentMethod.authToken,
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
            shippingOptions: result.shipping_options
          });
        }
      });
    });

    return paymentRequest;
  }
};

function handleServerResponse(response, payment) {
  if (response.error) {
      showError(response.error);
      completePaymentRequest(payment, 'fail');
  } else if (response.requires_action) {
    stripe.handleCardAction(
      response.stripe_payment_intent_client_secret
    ).then(function(result) {
      if (result.error) {
        showError(result.error.message);
      } else {
        fetch('/stripe/confirm_payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spree_payment_method_id: Spree.stripePaymentMethod.config.id,
            stripe_payment_intent_id: result.paymentIntent.id,
            authenticity_token: Spree.stripePaymentMethod.authToken
          })
        }).then(function(confirmResult) {
          return confirmResult.json();
        }).then(handleServerResponse);
      }
    });
  } else {
    completePaymentRequest(payment, 'success');
    submitPayment(payment);
  }
}

function completePaymentRequest(payment, state) {
  if (payment && typeof payment.complete === 'function') {
    payment.complete(state);
  }
}

function showError(error) {
  Spree.stripePaymentMethod.errorElement.text(error).show();
  setTimeout(function() {
    $.rails.enableElement(submitButton[0]);
    submitButton.removeAttr('disabled').removeClass('disabled');
  }, 100);
};
