import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';



Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://7j77zrcx2bdvfaz5iejdmifvhi.appsync-api.us-west-2.amazonaws.com/graphql',
      region: 'us-west-2',
      defaultAuthMode: 'iam'
    }
  },
  Auth: {
    Cognito: {
      identityPoolId: 'us-west-2:cdb2926d-aba0-41e4-ae0c-1d02f283b2cd',
      region: 'us-west-2'
    }
  }
});

fetchAuthSession().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

reportWebVitals();