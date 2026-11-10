import {useEffect,useState} from 'react';
import {liveLocation} from '../lib/live-location';
export function useLiveLocation(){const [state,setState]=useState(liveLocation.getSnapshot);useEffect(()=>{const release=liveLocation.retain(),unsubscribe=liveLocation.subscribe(()=>setState(liveLocation.getSnapshot()));setState(liveLocation.getSnapshot());function visibility(){if(document.hidden)liveLocation.pause();else liveLocation.resume();}document.addEventListener('visibilitychange',visibility);if(document.hidden)liveLocation.pause();return()=>{unsubscribe();release();document.removeEventListener('visibilitychange',visibility);};},[]);return state;}
export default function LocationStatus(){useLiveLocation();return null;}
