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

var cardNumber = Spree.Stripe.elements.create('cardNumber', {style: style});
var cardExpiry = Spree.Stripe.elements.create('cardExpiry', {style: style});
var cardCvc = Spree.Stripe.elements.create('cardCvc', {style: style});

cardNumber.mount('#card_number');
cardExpiry.mount('#card_expiry');
cardCvc.mount('#card_cvc');
