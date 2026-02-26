import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import config from '../src/aws-exports.js';
import fs from 'fs';

Amplify.configure(config);
const client = generateClient();

const listWeightEntries = /* GraphQL */`
  query ListWeightEntries {
    listWeightEntries(limit: 1000) {
      items {
        id
        date
        weight
        createdAt
      }
    }
  }
`;

const result = await client.graphql({ query: listWeightEntries });
const items = result.data.listWeightEntries.items;

items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const csv = ['id,date,weight,createdAt',
  ...items.map(i => `${i.id},${i.date},${i.weight},${i.createdAt}`)
].join('\n');

const filename = `weight-export-${new Date().toISOString().slice(0,10)}.csv`;
fs.writeFileSync(filename, csv);
console.log(`Exported ${items.length} entries to ${filename}`);
