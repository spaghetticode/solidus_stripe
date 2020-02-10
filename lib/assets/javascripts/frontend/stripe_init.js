Spree.stripePaymentMethod = {
  config: $('[data-stripe-config').data('stripe-config'),
  authToken: $('meta[name="csrf-token"]').attr('content'),
  requestShipping: false
}
Spree.stripePaymentMethod.element = $('#payment_method_' + Spree.stripePaymentMethod.config.id);
Spree.stripePaymentMethod.form = Spree.stripePaymentMethod.element.parents('form');
Spree.stripePaymentMethod.errorElement = Spree.stripePaymentMethod.form.find('#card-errors');
Spree.stripePaymentMethod.submitButton = Spree.stripePaymentMethod.form.find('input[type="submit"]');

Spree.Stripe = {
  api: Stripe(Spree.stripePaymentMethod.config.publishable_key)
}
Spree.Stripe.elements = Spree.Stripe.api.elements({locale: 'en'});

function stripeTokenHandler(token) {
  var baseSelector = `<input type='hidden' class='stripeToken' name='payment_source[${Spree.stripePaymentMethod.config.id}]`;
  var element = Spree.stripePaymentMethod.element;

  element.append(`${baseSelector}[gateway_payment_profile_id]' value='${token.id}'/>`);
  element.append(`${baseSelector}[last_digits]' value='${token.card.last4}'/>`);
  element.append(`${baseSelector}[month]' value='${token.card.exp_month}'/>`);
  element.append(`${baseSelector}[year]' value='${token.card.exp_year}'/>`);
  Spree.stripePaymentMethod.form.find('input#cc_type').val(mapCC(token.card.brand || token.card.type));
};

function initElements() {
  var elements = Spree.Stripe.elements;

  var style = {
    base: {
      color: 'black',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '14px',
      '::placeholder': {
        color: 'silver'
      }
    },
    invalid: {
      color: 'red',
      iconColor: 'red'
    }
  };

  elements.create('cardExpiry', {style: style}).mount('#card_expiry');
  elements.create('cardCvc', {style: style}).mount('#card_cvc');

  var cardNumber = elements.create('cardNumber', {style: style});
  cardNumber.mount('#card_number');

  return cardNumber;
}

function setUpPaymentRequest(config) {
  if (typeof config != 'undefined') {
    var paymentRequest = Spree.Stripe.api.paymentRequest({
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

    var prButton = Spree.Stripe.elements.create('paymentRequestButton', {
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
    Spree.Stripe.api.handleCardAction(
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

  submitButton = Spree.stripePaymentMethod.submitButton;
  setTimeout(function() {
    $.rails.enableElement(submitButton[0]);
    submitButton.removeAttr('disabled').removeClass('disabled');
  }, 100);
};

function mapCC(ccType) {
  if (ccType === 'MasterCard') {
    return 'mastercard';
  } else if (ccType === 'Visa') {
    return 'visa';
  } else if (ccType === 'American Express') {
    return 'amex';
  } else if (ccType === 'Discover') {
    return 'discover';
  } else if (ccType === 'Diners Club') {
    return 'dinersclub';
  } else if (ccType === 'JCB') {
    return 'jcb';
  }
};
