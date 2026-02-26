/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createWeightEntry = /* GraphQL */ `
  mutation CreateWeightEntry(
    $input: CreateWeightEntryInput!
    $condition: ModelWeightEntryConditionInput
  ) {
    createWeightEntry(input: $input, condition: $condition) {
      id
      date
      weight
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updateWeightEntry = /* GraphQL */ `
  mutation UpdateWeightEntry(
    $input: UpdateWeightEntryInput!
    $condition: ModelWeightEntryConditionInput
  ) {
    updateWeightEntry(input: $input, condition: $condition) {
      id
      date
      weight
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deleteWeightEntry = /* GraphQL */ `
  mutation DeleteWeightEntry(
    $input: DeleteWeightEntryInput!
    $condition: ModelWeightEntryConditionInput
  ) {
    deleteWeightEntry(input: $input, condition: $condition) {
      id
      date
      weight
      createdAt
      updatedAt
      __typename
    }
  }
`;
