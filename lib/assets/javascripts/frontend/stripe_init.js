Spree.stripePaymentMethod = {
  config: $('[data-stripe-config').data('stripe-config'),
  authToken: $('meta[name="csrf-token"]').attr('content'),
  requestShipping: false
}
Spree.stripePaymentMethod.element = $('#payment_method_' + Spree.stripePaymentMethod.config.id);
Spree.stripePaymentMethod.form = Spree.stripePaymentMethod.element.parents('form');
Spree.stripePaymentMethod.errorElement = Spree.stripePaymentMethod.form.find('#card-errors');
Spree.stripePaymentMethod.submitButton = Spree.stripePaymentMethod.form.find('input[type="submit"]');

var stripe = Stripe(Spree.stripePaymentMethod.config.publishable_key);
var elements = stripe.elements({locale: 'en'});

function stripeTokenHandler(token) {
  var baseSelector = `<input type='hidden' class='stripeToken' name='payment_source[${Spree.stripePaymentMethod.config.id}]`;

  Spree.stripePaymentMethod.element.append(`${baseSelector}[gateway_payment_profile_id]' value='${token.id}'/>`);
  Spree.stripePaymentMethod.element.append(`${baseSelector}[last_digits]' value='${token.card.last4}'/>`);
  Spree.stripePaymentMethod.element.append(`${baseSelector}[month]' value='${token.card.exp_month}'/>`);
  Spree.stripePaymentMethod.element.append(`${baseSelector}[year]' value='${token.card.exp_year}'/>`);
  Spree.stripePaymentMethod.form.find('input#cc_type').val(mapCC(token.card.brand || token.card.type));
};
