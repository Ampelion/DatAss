export const getWeightEntry = /* GraphQL */ `
  query GetWeightEntry($id: ID!) {
    getWeightEntry(id: $id) {
      id
      date
      weight
    }
  }
`;

export const listWeightEntries = /* GraphQL */ `
  query ListWeightEntries(
    $filter: TableWeightEntryFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listWeightEntries(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        weight
      }
      nextToken
    }
  }
`;