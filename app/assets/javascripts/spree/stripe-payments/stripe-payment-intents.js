Spree.StripePaymentIntents = function() {
  Spree.StripeElements.call(this);
};

Spree.StripePaymentIntents.prototype = Object.create(Spree.StripeElements.prototype);
Object.defineProperty(Spree.StripePaymentIntents.prototype, 'constructor', {
  value: Spree.StripePaymentIntents,
  enumerable: false,
  writable: true
});

Spree.StripePaymentIntents.prototype.init = function() {
  this.setUpPaymentRequest();
  this.initElements();
};

Spree.StripePaymentIntents.prototype.onPrPayment = function(payment) {
  if (payment.error) {
    this.showError(payment.error.message);
  } else {
    var that = this;

    this.elementsTokenHandler(payment.paymentMethod);
    fetch('/stripe/confirm_payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spree_payment_method_id: this.config.id,
        stripe_payment_method_id: payment.paymentMethod.id,
        authenticity_token: this.authToken
      })
    }).then(function(response) {
      response.json().then(function(json) {
        that.handleServerResponse(json, payment);
      })
    });
  }
};

Spree.StripePaymentIntents.prototype.onFormSubmit = function(event) {
  if (this.element.is(':visible')) {
    event.preventDefault();

    this.errorElement.text('').hide();

    this.stripe.createPaymentMethod(
      'card',
      this.cardNumber
    ).then(this.onIntentsPayment.bind(this));
  }
};

Spree.StripePaymentIntents.prototype.submitPayment = function(_payment) {
  this.form.unbind('submit').submit();
};

Spree.StripePaymentIntents.prototype.onIntentsPayment = function(payment) {
  if (payment.error) {
    this.showError(payment.error.message);
  } else {
    var that = this;

    this.elementsTokenHandler(payment.paymentMethod);
    fetch('/stripe/confirm_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spree_payment_method_id: this.config.id,
        stripe_payment_method_id: payment.paymentMethod.id,
        authenticity_token: this.authToken
      })
    }).then(function(response) {
      response.json().then(function(json) {
        that.handleServerResponse(json, payment);
      })
    });
  }
};
