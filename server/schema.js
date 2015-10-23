import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  nodeDefinitions,
  connectionDefinitions,
  connectionArgs,
  connectionFromArray,
  globalIdField,
  fromGlobalId,
  mutationWithClientMutationId,
} from 'graphql-relay';

import {
  getResource,
  getAllResources,
  createResource,
  removeResource,
  updateResource,
} from './db';

const {nodeInterface, nodeField} = nodeDefinitions(
  (globalId) => {
    const {type, id} = fromGlobalId(globalId);
    return getResource(type, id) || null;
  },
  (obj) => {
    switch (obj.type) {
    case 'Draft':
      return draftType;
    default:
      return null;
    }
  }
);

const draftType = new GraphQLObjectType({
  name: 'Draft',
  fields: {
    id: globalIdField('Draft'),
    content: {
      type: GraphQLString,
    },
  },
  interfaces: [nodeInterface],
});

const {connectionType: draftConnection} =
  connectionDefinitions({name: 'Draft', nodeType: draftType});

const queryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    node: nodeField,
    drafts: {
      type: draftConnection,
      args: connectionArgs,
      resolve: (root, args) => connectionFromArray(
        getAllResources('Draft'),
        args
      ),
    },
  },
});

const draftMutationType = new GraphQLObjectType({
  name: 'DraftMutation',
  fields: () => ({
    create: mutationWithClientMutationId({
      name: 'DraftCreateMutation',
      inputFields: {
        content: {
          type: GraphQLString,
        },
      },
      outputFields: {
        node: {
          type: nodeInterface,
          resolve: (payload) => payload,
        },
      },
      mutateAndGetPayload: ({ content }) => {
        return createResource('Draft', { content });
      },
    }),
    remove: mutationWithClientMutationId({
      name: 'DraftRemoveMutation',
      inputFields: {
        id: {
          type: GraphQLString,
        },
      },
      outputFields: {
        node: {
          type: nodeInterface,
          resolve: (payload) => payload,
        },
      },
      mutateAndGetPayload: ({ id: globalId }) => {
        const {id} = fromGlobalId(globalId);
        removeResource('Draft', id);
        return null;
      },
    }),
    update: mutationWithClientMutationId({
      name: 'DraftUpdateMutation',
      inputFields: {
        id: {
          type: GraphQLString,
        },
        content: {
          type: GraphQLString,
        },
      },
      outputFields: {
        node: {
          type: nodeInterface,
          resolve: (payload) => payload,
        },
      },
      mutateAndGetPayload: ({ id: globalId, content }) => {
        const {id} = fromGlobalId(globalId);
        return updateResource('Draft', id, { content });
      },
    }),
  }),
});

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    draft: {
      type: draftMutationType,
      resolve: (result) => result,
    },
  }),
});

export default new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
});

