# NodeJS Oracle Server
NodeJS server which is responsible for updating the value of ETH in GBP (£) on my Ropsten Oracle contract.
Makes use of the CoinGecko API to make this possible.
## Assumptions
1. Security is not of importance: private key kept in plaintext.
2. CoinGecko cannot be used to manipulate the price (single source of information is not a good idea!!)
3. Fetching the pricing data every 60 seconds is an acceptable frequency (of course within such a volatile market this would not be ideal in a production stage product)