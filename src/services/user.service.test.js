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
const user_service_1 = require("./user.service");
const express_1 = require("./__mocks__/express");
const database_1 = require("../database");
const userService = new user_service_1.UserService();
describe('QUERIES', () => {
    let db;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        db = yield database_1.connectDatabase();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db.client.close();
    }));
    test('The User query returns a user', () => __awaiter(void 0, void 0, void 0, function* () {
        const testUserId = '5d378db94e84753160e08b55';
        const returnedUser = yield userService.queryUser({
            id: testUserId,
            db,
            req: express_1.request,
        });
        expect(returnedUser).toBeTruthy();
        expect(returnedUser).not.toBeNull();
        expect(returnedUser._id).toEqual(testUserId);
    }));
});
