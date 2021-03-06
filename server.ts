/**
 * Created by barthclem on 2/7/18.
 */
'use strict';

import * as express from 'express';
import * as HTTP from 'http';
import * as HTTPS from 'https';
import * as fs from 'fs';
import * as mongoose from 'mongoose';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';

import {NextFunction, Request, Response} from 'express';
import GameRoutes from './routes/routes';
import {Error} from 'tslint/lib/error';

const  options: any = {
    key: fs.readFileSync('./encryption/key.pem', 'utf-8'),
    cert: fs.readFileSync('./encryption/server.crt', 'utf-8')
};


class GameServer {

    app: any;
    server: any;
    https: any;
   constructor () {
       this.app = express();
       this.https = new HTTPS.Server(options, this.app);
       this.initializeDB();
       this.middleware();
       // this.handleRoutesError();
       this.handleInternalServerError();
   }

   private middleware() {
       this.app.use(this.crossOriginMiddleWare());
       this.app.use(bodyParser.json());
       this.app.use(bodyParser.urlencoded({extended: true}));
       this.app.use(logger('dev'));
        this.app.use( GameRoutes);
   }

    start() {
        this.https.listen(4000 , () => {
            console.log('server is started on port 4000');
            this.app._router.stack.forEach(function(r: any) {
                if (r.route && r.route.path) {
                    console.log('route', r.route.path);
                }
            });
        });
        // this.app.listen(4000, () => {
        //     console.log('server is started on port 4000');
        //     this.app._router.stack.forEach(function(r: any) {
        //         if (r.route && r.route.path) {
        //             console.log('route', r.route.path);
        //         }
        //     });
        // });
    }

    crossOriginMiddleWare() {
        return (req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        };
    }

    initializeDB (): void {
        mongoose.connect('mongodb://localhost/quix_game')
            .then(() =>  console.log('connection good'))
            .catch((err) => console.error(err));
    }


    handleInternalServerError () {
       this.app.use((req: Request, res: Response, next: NextFunction)  => {
            console.log(`Error: Route not found - ${req.url}  -- ${req.hostname} -- ${req.path}  -- ${req.params}`);
            const error = new Error('Route not found');
            next(error);
        });
        this.app.use((error: any, req: Request, res: Response, next: NextFunction) => {
            console.log(`Node Error => ${JSON.stringify(error)}`);
            res.locals.message = error.message;
            res.locals.error = req.app.get('env') === 'development' ? error : {};
            res.status(error.status || 500);
            res.json({error: true, type: 'internal server'});
        });
        }

}

const gameServer = new GameServer();
gameServer.start();
