import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { nhost } from './nhost';

// Hasura endpoint
const HASURA_URL = 'https://bibngxwqloplxowiyrco.hasura.ap-south-1.nhost.run/v1/graphql';
// HTTP link
const httpLink = createHttpLink({
  uri: HASURA_URL,
});

// Auth link (adds JWT + user headers)
const authLink = setContext(async (_, { headers }) => {
  const token = await nhost.auth.getAccessToken(); // 👈 awaited now
  const user = nhost.auth.getUser();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      ...(user?.id
        ? {
            'x-hasura-role': 'user',
            'x-hasura-user-id': user.id,
          }
        : {}),
    },
  };
});

// WebSocket link (for subscriptions)
const wsLink = new GraphQLWsLink(
  createClient({
    url: HASURA_URL.replace('http', 'ws'),
    connectionParams: async () => {
      const token = await nhost.auth.getAccessToken(); // 👈 awaited now
      const user = nhost.auth.getUser();

      return {
        headers: {
          authorization: token ? `Bearer ${token}` : '',
          ...(user?.id
            ? {
                'x-hasura-role': 'user',
                'x-hasura-user-id': user.id,
              }
            : {}),
        },
      };
    },
  })
);

// Split link: HTTP for queries/mutations, WS for subscriptions
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

// Apollo client
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

// Clear Apollo cache when user logs out
nhost.auth.onAuthStateChanged((event, session) => {
  console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
  if (event === 'SIGNED_OUT') {
    apolloClient.clearStore();
  }
});
