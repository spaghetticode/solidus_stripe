Spree.StripeElements = function() {
  Spree.StripePayment.call(this);

  this.form = this.element.parents('form');
  this.errorElement = this.form.find('#card-errors');
  this.submitButton = this.form.find('input[type="submit"]');
};

Spree.StripeElements.prototype = Object.create(Spree.StripePayment.prototype);
Object.defineProperty(Spree.StripeElements.prototype, 'constructor', {
  value: Spree.StripeElements,
  enumerable: false,
  writable: true
});

Spree.StripeElements.prototype.init = function() {
  this.initElements();
};

Spree.StripeElements.prototype.initElements = function() {
  var buildElements = function(elements) {
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
  };

  this.cardNumber = buildElements(this.elements);

  var cardChange = function(event) {
    if (event.error) {
      this.showError(event.error.message);
    } else {
      this.errorElement.hide().text('');
    }
  };
  this.cardNumber.addEventListener('change', cardChange.bind(this));
  this.form.bind('submit', this.onFormSubmit.bind(this));
};

Spree.StripeElements.prototype.showError = function(error) {
  var message = error.message || error;

  this.errorElement.text(message).show();
  this.submitButton.removeAttr('disabled').removeClass('disabled');
};

Spree.StripeElements.prototype.onFormSubmit = function(event) {
  if (this.element.is(':visible')) {
    event.preventDefault();

    var onTokenCreate = function(result) {
      if (result.error) {
        this.showError(result.error.message);
      } else {
        this.elementsTokenHandler(result.token);
        this.form[0].submit();
      }
    };

    this.stripe.createToken(this.cardNumber).then(onTokenCreate.bind(this));
  }
};

Spree.StripeElements.prototype.elementsTokenHandler = function(token) {
  var mapCC = function(ccType) {
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

  var baseSelector = `<input type='hidden' class='stripeToken' name='payment_source[${this.config.id}]`;

  this.element.append(`${baseSelector}[gateway_payment_profile_id]' value='${token.id}'/>`);
  this.element.append(`${baseSelector}[last_digits]' value='${token.card.last4}'/>`);
  this.element.append(`${baseSelector}[month]' value='${token.card.exp_month}'/>`);
  this.element.append(`${baseSelector}[year]' value='${token.card.exp_year}'/>`);
  this.form.find('input#cc_type').val(mapCC(token.card.brand || token.card.type));
};
