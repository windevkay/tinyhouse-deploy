"use strict";
// eslint-disable-next-line @typescript-eslint/no-var-requires
//require('dotenv').config(); //turn this off when deploying, on in development
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const database_1 = require("./database");
const graphql_1 = require("./graphql");
const port = process.env.PORT;
const mount = (app) => __awaiter(void 0, void 0, void 0, function* () {
    const db = yield database_1.connectDatabase();
    //set body parser and limit requests to 2mb
    app.use(body_parser_1.default.json({ limit: '2mb' }));
    //set cookie parsing middleware
    app.use(cookie_parser_1.default(process.env.SECRET));
    //compress responses
    app.use(compression_1.default());
    //we will serve the frontend using this node server
    app.use(express_1.default.static(`${__dirname}/client`));
    //for any incoming requests, serve the compile html file for the frontend
    app.get('/*', (_req, res) => res.sendFile(`${__dirname}/client/index.html`));
    // create apollo server
    const server = new apollo_server_express_1.ApolloServer({
        typeDefs: graphql_1.typeDefs,
        resolvers: graphql_1.resolvers,
        context: ({ req, res }) => ({ db, req, res }),
    });
    server.applyMiddleware({ app, path: '/api' });
    app.listen(port);
    console.log(`[app]: http://localhost:${port}`);
});
mount(express_1.default());
