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

var cardNumber = elements.create('cardNumber', {style: style});
var cardExpiry = elements.create('cardExpiry', {style: style});
var cardCvc = elements.create('cardCvc', {style: style});

cardNumber.mount('#card_number');
cardExpiry.mount('#card_expiry');
cardCvc.mount('#card_cvc');

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
