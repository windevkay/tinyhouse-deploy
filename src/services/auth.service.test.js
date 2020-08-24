"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
const auth_service_1 = require("./auth.service");
const express_1 = require("./__mocks__/express");
const database_1 = require("../database");
const authService = new auth_service_1.AuthService();
describe('QUERIES', () => {
    test('That queryAuthUrl returns a string', () => __awaiter(void 0, void 0, void 0, function* () {
        const authURL = yield authService.queryAuthUrl();
        expect(typeof authURL).toBe('string');
        expect(authURL).not.toBeUndefined();
    }));
});
describe('MUTATIONS', () => {
    let db;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        db = yield database_1.connectDatabase();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db.client.close();
    }));
    test('Login mutation returns a Viewer via Cookie', () => __awaiter(void 0, void 0, void 0, function* () {
        const loginRequest = yield authService.mutationLogin({
            input: null,
            db,
            res: express_1.response,
            req: express_1.request,
        });
        expect(loginRequest).toBeTruthy();
        expect(loginRequest.didRequest).toEqual(true);
    }));
});
