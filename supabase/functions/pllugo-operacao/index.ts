import {createHandler} from './handler.ts';
import * as auth from './app/api/auth/route.ts';
import * as users from './app/api/users/route.ts';
import * as data from './app/api/data/route.ts';
import * as assign from './app/api/assign/route.ts';
import * as photo from './app/api/photo/route.ts';
import * as geocode from './app/api/geocode/route.ts';
Deno.serve(createHandler({'/api/auth':auth,'/api/users':users,'/api/data':data,'/api/assign':assign,'/api/photo':photo,'/api/geocode':geocode}));
