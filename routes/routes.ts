import {NextFunction, Router, Express, Response, Request} from 'express';
import {GameModel, IGameModel, ITeamSchema} from '../models/gameModel';
/**
 * Created by barthclem on 2/7/18.
 */

export class GameRoutes {
    static gameInstancePort = 3005;
    static gamePorts: Map<string, number>  = new Map<string, number>();
    router: Router;

    static startGameInstance ( gameName: string) {
        const { spawn } = require('child_process');
        GameRoutes.gamePorts.set(gameName, this.gameInstancePort);
        const indexer = spawn(process.argv[0], ['./build/index.js', 'child', gameName, this.gameInstancePort++], {
            stdio: [null, null, null, 'pipe']
        });

        indexer.stdout.on('data', (data: any) => {
            console.log(' Indexer stdout: ' + data.toString());
        });

        indexer.stderr.on('data', (data: any) => {
            console.log(`Indexer stderr: ${data}`);
            console.log(`Indexer stderr: ${JSON.stringify(data)}`);
        });

        indexer.on('close', (code: any) => {
            if (code !== 0) {
                console.log(`Indexer process exited with code ${code}`);
            }
        });
    }
    constructor() {
        this.router = Router();
    }

    initiateRoutes() {
        this.router.get('/', this.getGames);
        this.router.post('/', this.createGame);
        this.router.get('/:gameName', this.getGame);
        this.router.post('/:gameName', this.userReg);
        this.router.put('/game/:gameName', this.updateGameTeams);
        this.router.put('/team/:teamName', this.updateTeams);
        this.router.delete('/:gameName', this.deleteGame);
        // this.router.use('*', this.handleRoutesError);
    }

    public createGame(request: Request, response: Response, next: NextFunction) {
        const gameBody = request.body;
        if (!gameBody.name || !gameBody.teamList) {
            return response.status(200).json({success: false, message: 'ensure the parameters are set\n {name: string, teamList: string []}'});
        }
        gameBody.link = `https://quix-app.herokuapp.com/g/${gameBody.name}`;
        gameBody.teamList = gameBody.teamList.map((teamName: string) => {
            return <ITeamSchema> {
                teamName: teamName,
                score: 0,
                position: 0
            };
        });
        console.log(`GAME DATA => ${JSON.stringify(gameBody)}`);
        GameModel.create(gameBody, (err: any, data: any) => {
            if (err) {
                if (err.name === 'BulkWriteError' && err.code === 11000) {
                    // Duplicate username
                    return response.status(500).send({ success: false, message: 'game name already exist!' });
                }
                // Some other error
                return next(err);
            }
            console.log(`GAME => ${JSON.stringify(data)}`);
            GameRoutes.startGameInstance(gameBody.name);
            response.json({success: true, data: data});
        });
    }

   public getGames(request: Request, response: Response, next: NextFunction) {
      GameModel.find((err: any, gameList: IGameModel []) => {
          if (err) {
              return next(err);
          }
          console.log(`Game List : ${JSON.stringify(gameList)}`);
         return  response.json({success: true, data: gameList});
      });
   }
   public userReg(request: Request, response: Response, next: NextFunction) {
       const gameName = request.params.gameName;
       const regData = {
           gameName: gameName,
           gamePort: GameRoutes.gamePorts.get(gameName)
       };
       console.log(`\n\n Game Ports List : ${JSON.stringify(regData)}`);
       if (GameRoutes.gamePorts.get(gameName)) {
           return  response.json({success: true, data: regData});
       } else {
           return  response.json({success: false, data: { error: 'The game does not exist'}});
       }
   }

    public getGame(request: Request, response: Response, next: NextFunction) {
        const gameName = request.params.gameName;
        GameModel.findOne({'name': gameName}, (err: any, game: any) => {
            if (err) {
                return next(err);
            }
            console.log(`Game Instance: ${JSON.stringify(game)}`);

            return  response.status(200).json({success: true, data: game});
        });
    }

    public updateGameTeams(request: Request, response: Response, next: NextFunction) {
        const gameName = request.params.gameName;
        const teamName = request.body.teamName;
        const team = <ITeamSchema>{
            teamName: teamName,
            score: 0,
            position: 0
        };
        GameModel.findOne({'name': gameName}, (err: any, game: IGameModel) => {
            if (err) {
                return response.json({success: false, message: 'please enter a valid game name'});
            }
            if (game) {
                const teams = game.teamList;
                if (teams.find(iteam => iteam.teamName === teamName)) {
                    return response.json({success: false, message: 'Team Name already chosen'});
                } else if (teams.length > 6) {
                    return response.json({success: false, message: 'The maximum number of teams reached'});
                } else {
                    GameModel.findOneAndUpdate({'name': gameName}, {$push: {teamList: team}}, {new: true},
                        (err: any, game: any) => {
                        if (err) {
                            return next(err);
                        }
                        console.log(`Game Instance: ${JSON.stringify(game)}`);

                        return  response.status(200).json({success: true, data: game});
                    });
                }
            }  else  {
                return response.json({success: false, message: 'The game does not exist'});
            }
        });

    }

    public updateTeams(request: Request, response: Response, next: NextFunction) {
        const gameName = request.body.gameName;
        const teamName = request.params.teamName;
        const memberName = request.body.username;
        if ( !teamName || !gameName || !memberName) {
            return response.status(200).json({success: false, message: 'ensure the parameters are set'});
        }
        GameModel.findOne({'name': gameName}, (err: any, game: IGameModel) => {
            if (err) {
                return response.json({success: false, message: 'please enter a valid game name'});
            }
            if (game) {
                const teams = game.teamList;
                const iteam = teams.find(zteam => zteam.teamName === teamName);
                if (iteam) {
                    if (iteam.members && (iteam.members.length > 6)) {
                        return response.json({success: false, message: 'The maximum number of members reached'});
                    } else {
                        GameModel.findOneAndUpdate({'name': gameName, 'teamList.teamName': teamName},
                            {$push: {
                            'teamList.$.members': memberName
                            }}, { new: true}, (error: any, newGame: any) => {
                                if (error) {
                                    return next(error);
                                }
                                console.log(`Updated Team: ${JSON.stringify(newGame)}`);

                                return  response.status(200).json({success: true, data: newGame});
                            });
                    }
                } else {
                    return response.json({success: false, message: 'The team does not exist'});
                }
            }
        });

    }



    public deleteGame(request: Request, response: Response, next: NextFunction) {
        const gameName = request.params.gameName;
        GameModel.remove({'name' : gameName}, (err: any) => {
            if (err) {
                return next(err);
            }
            return response.json({success: true, message: 'item is deleted successfully'});
        });
    }
    handleRoutesError (req: Request, res: Response, next: NextFunction)  {
            console.log(`Error: Route not found - ${req.url}  -- ${req.hostname} -- ${req.path}  -- ${req.params}`);
            const error = new Error('Route not found');
            next(error);
    }

}
const gameRoutes = new GameRoutes();
gameRoutes.initiateRoutes();
export default gameRoutes.router;
