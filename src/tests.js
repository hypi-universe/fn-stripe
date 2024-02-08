const test = require('node:test');
const assert = require('node:assert').strict;
const stripe = require('./main');

async function doTest(input, callback) {
  if (!input.env) {
    input.env = {}
  }
  //Make sure to use a stripe test key NOT a production one!
  input.env['STRIPE_SECRET'] = process.env.STRIPE_SECRET;
  await stripe.main(input, callback)
}

test('an unsupported resource should fail with 404 code', async (t) => {
  await doTest({
    'args': {
      'resource': 'anything'
    }
  }, (val, err) => {
    assert.strictEqual(err.code, 1);
    assert.strictEqual(err.message, "Unsupported resource type 'anything'");
  })
});

test('can create a charge', async (t) => {
  await doTest({
    'args': {
      'resource': 'charges',
      'method': 'create',
      'charge': {
        amount: 1099,
        currency: 'usd',
        source: 'tok_visa',
      },
      'paramOrder': ['charge']
    }
  }, (val, err) => {
    assert.strictEqual(val.status, 'succeeded');
    assert.strictEqual(val.object, 'charge');
    assert.strictEqual(val.amount, 1099);
    assert.strictEqual(err, undefined);
  })
});

test('can create a customer', async (t) => {
  await doTest({
    'args': {
      'resource': 'customers',
      'method': 'create',
      'customer': {
        name: 'Jenny Rosen',
        email: 'jennyrosen@example.com',
      },
      'paramOrder': ['customer']
    }
  }, (val, err) => {
    assert.strictEqual(val.object, 'customer');
    assert.strictEqual(val.balance, 0);
    assert.strictEqual(val.email, 'jennyrosen@example.com');
    assert.strictEqual(err, undefined);
  })
});
