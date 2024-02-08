# Hypi Stripe Serverless Function

This function provides access to Stripe's API as a serverless function.

## Usage Overview

You can use it by adding a function to your Hypi `Query` or `Mutation` types in the schema.
If you don't have these types, add them, if you do, modify them. For example

```graphql
type Mutation {
    createCharge(resource: String="charges", method:String="create", paramOrder: [String!] = ["charge"], charge: Json): Json @fn(name: "stripe", version: "v1", src: "hypi", env: ["STRIPE_SECRET"])
}
```

This example shows how to add an API for creating a charge.

`STRIPE_SECRET` **env is required**. You create an environment variable in your Hypi project with this name and provide the Stripe secret as its value.
`resource` - is one of the Stripe resource types e.g. `charges`, `customers` and `paymentIntents` are all resources.
`method` - is the operation you want to perform on the resource. In the example above we call the `create` operation to create a charge
`paramOrder` - tells the function to pass the `charge` parameter of the `createCharge` function into the `create` operation
``

## Env keys

* `STRIPE_SECRET` is required - it is the API key for the Stripe API

## Usage detail

The function uses the official Stripe NodeJS client library.
It is a very lightweight wrapper around it and so in order to make full use of this function you can consult the official Stripe documentation for [NodeJS](https://stripe.com/docs/api?lang=node).

The function requires 3 main things to work (`resource`, `method`, `paramOrder`), all relate to the Stripe NodeJS library.

To use an example, in the Stripe documentation, creating a customer is given as:

```javascript
const customer = await stripe.customers.create({
  name: 'Jenny Rosen',
  email: 'jennyrosen@example.com',
});
```

* `resource` in this example is `customers`
* `method` is `create`
* `paramOrder` is how Hypi allows you to specify the input to the `stripe.customers.create` method. It is an array containing the name of the fields in your Hypi GraphQL function in the order they should be given to the Stripe client.

For example
```graphql
type Mutation {
    createCustomer(resource: String="customers", method:String="create", paramOrder: [String!] = ["customer"], customer: Json): Json @fn(name: "stripe", version: "v1", src: "hypi", env: ["STRIPE_SECRET"])
}
```

Note the relationship between `paramOrder: [String!] = ["customer"]` and ` customer: Json`.

To emphasise the point, let's try a Stripe method call which requires multiple parameters.

```javascript
const customer = await stripe.customers.update(
  'cus_NffrFeUfNV2Hib',
  {
    metadata: {
      order_id: '6735',
    },
  }
);
```
This would [update a customer](https://stripe.com/docs/api/customers/update).

The equivalent Hypi schema to make this API call would be similar to:
```graphql
type Mutation {
    updateCustomer(resource: String="customers", method:String="update", paramOrder: [String!] = ["id","payload"], id: String!, payload: Json!): Json @fn(name: "stripe", version: "v1", src: "hypi", env: ["STRIPE_SECRET"])
}
```

The `paramOrder: [String!] = ["id","payload"]` instructs the Hypi Stripe function to take the valid of the `id` argument and pass it as the first argument to the `update` method and take the `payload` argument and pass it as the second argument to the `update` method.
i.e. the order the parameter names are listed determines the order they get passed to the Stripe NodeJS client.

# Build & Release

**THIS IS NOT REQUIRED**. Hypi publishes the Stripe function so that it is publicly available by setting the `src` of the `@fn` to `hypi`.
If you want to make changes to this function and keep those changes privately then you can publish your copy of the function by following the following steps.

1. Make sure you've logged into the Hypi container register by running `docker login hcr.hypi.app -u hypi` and enter a token from your Hypi account as the password
2. `VERSION=v1 npm run build`
3. `VERSION=v1 npm run deploy`
4. In your Hypi project at [console.hypi.app](https://console.hypi.app) reference your function as shown in the usage above
