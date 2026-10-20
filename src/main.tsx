import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './app';
import InstallApp from '../components/install-app';
import './styles.css';
createRoot(document.getElementById('root')!).render(<InstallApp><App/></InstallApp>);
