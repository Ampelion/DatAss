import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import config from '../src/aws-exports.js';

Amplify.configure(config);
const client = generateClient();

const createWeightEntry = /* GraphQL */`
  mutation CreateWeightEntry($input: CreateWeightEntryInput!) {
    createWeightEntry(input: $input) { id }
  }
`;

const rawData = [
  { date: '9/10/25', weight: 255 },
  { date: '9/22/25', weight: 245 },
  { date: '10/9/25', weight: 238 },
  { date: '10/16/25', weight: 235 },
  { date: '10/19/25', weight: 234 },
  { date: '10/22/25', weight: 233 },
  { date: '10/25/25', weight: 231 },
  { date: '10/29/25', weight: 229 },
  { date: '10/31/25', weight: 228 },
  { date: '11/2/25', weight: 227 },
  { date: '11/3/25', weight: 226 },
  { date: '11/6/25', weight: 226 },
  { date: '11/10/25', weight: 225 },
  { date: '11/14/25', weight: 223 },
  { date: '11/15/25', weight: 222 },
  { date: '11/18/25', weight: 220 },
  { date: '11/25/25', weight: 218 },
  { date: '11/26/25', weight: 217 },
  { date: '11/29/25', weight: 216 },
  { date: '12/05/25', weight: 214 },
  { date: '12/12/25', weight: 213 },
  { date: '12/17/25', weight: 212 },
  { date: '12/31/25', weight: 211 },
  { date: '1/2/26', weight: 210 },
  { date: '1/8/26', weight: 208 },
  { date: '1/9/26', weight: 207 },
  { date: '1/10/26', weight: 206 },
  { date: '1/15/26', weight: 205 },
  { date: '1/17/26', weight: 204 },
  { date: '1/30/26', weight: 203 },
  { date: '2/03/26', weight: 202 },
  { date: '2/04/26', weight: 201 },
  { date: '2/09/26', weight: 200 },
  { date: '2/12/26', weight: 199 },
  { date: '2/15/26', weight: 198 },
];

for (const entry of rawData) {
  await client.graphql({
    query: createWeightEntry,
    variables: { input: entry }
  });
  console.log(`Inserted ${entry.date} - ${entry.weight} lbs`);
}

console.log('Done!');
