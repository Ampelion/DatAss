/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getWeightEntry = /* GraphQL */ `
  query GetWeightEntry($id: ID!) {
    getWeightEntry(id: $id) {
      id
      date
      weight
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listWeightEntries = /* GraphQL */ `
  query ListWeightEntries(
    $filter: ModelWeightEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeightEntries(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        weight
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
