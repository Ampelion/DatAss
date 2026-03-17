export const createWeightEntry = /* GraphQL */ `
  mutation CreateWeightEntry($input: CreateWeightEntryInput!) {
    createWeightEntry(input: $input) {
      id
      date
      weight
    }
  }
`;

export const updateWeightEntry = /* GraphQL */ `
  mutation UpdateWeightEntry($input: UpdateWeightEntryInput!) {
    updateWeightEntry(input: $input) {
      id
      date
      weight
    }
  }
`;

export const deleteWeightEntry = /* GraphQL */ `
  mutation DeleteWeightEntry($input: DeleteWeightEntryInput!) {
    deleteWeightEntry(input: $input) {
      id
    }
  }
`;
