import React from 'react';
import { render } from 'react-dom';
import App from './js/App';
import './css/app.scss';


if (process.env.NODE_ENV !== 'production') {
  localStorage.setItem('debug', 'awesome-react-app:*');
}

render(<App />, document.getElementById('root'));
