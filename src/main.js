const Stripe = require('stripe');

const ERRORS = {
  unsupported_resource: {
    code: 1,
    message: (res) => `Unsupported resource type '${res}'`,
  },
  unsupported_method: {
    code: 2,
    message: (res) => `Unsupported Stripe client method '${res}'`,
  },
  missing_param_order: {
    code: 3,
    message: `The order of parameters could not be determined. Add a paramOrder argument to your function call`,
  },
  stripe_error: {
    code: 4,
    message: (input) => `Stripe returned an error for call to ${input.args.resource}.${input.args.method}(...)`,
  }
};
const stateMachineSequence = [
  (state, stripe, input, callback) => {
    let resource = stripe[input.args.resource];
    if (!resource) callback(null, {
      code: ERRORS.unsupported_resource.code,
      message: ERRORS.unsupported_resource.message(input.args.resource)
    });
    return resource;
  },
  (state, stripe, input, callback) => {
    let method = state.at(-1)[input.args.method];
    if (!method) callback(null, {
      code: ERRORS.unsupported_method.code,
      method: ERRORS.unsupported_method.message(input.args.resource)
    });
    return method;
  },
  async (state, stripe, input, callback) => {
    let order = input.args.paramOrder;
    if (!order) callback(null, {
      code: ERRORS.missing_param_order.code,
      method: ERRORS.missing_param_order.message
    });
    let args = [];
    for (let o of order) {
      args.push(input.args[o]);
    }
    try {
      let res = await state.at(-1).apply(state.at(-2), args);
      callback(res)
    } catch (e) {
      callback(null, {
        code: ERRORS.stripe_error.code,
        method: ERRORS.stripe_error.message(input),
        stripe: e,
      })
    }
  }
];

async function stripe(input, callback) {
  const stripe = Stripe(input.env.STRIPE_SECRET);
  let okResult = null;
  let errResult = null;
  let state = [];
  for (let step of stateMachineSequence) {
    state.push(await step(state, stripe, input, (val, err) => {
      okResult = val;
      errResult = err;
    }));
    if (errResult) {
      break; //terminate state machine on first error
    }
  }
  callback(okResult, errResult)
}

exports.main = stripe;
