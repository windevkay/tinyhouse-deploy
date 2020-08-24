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
const listing_service_1 = require("./listing.service");
const express_1 = require("./__mocks__/express");
const types_1 = require("../lib/types");
const database_1 = require("../database");
const listingService = new listing_service_1.ListingService();
describe('QUERIES', () => {
    let db;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        db = yield database_1.connectDatabase();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db.client.close();
    }));
    test('Listing Query by ID returns a single listing', () => __awaiter(void 0, void 0, void 0, function* () {
        const returnedListing = yield listingService.queryListing({
            id: '5d378db94e84753160e08b30',
            db,
            req: express_1.request,
        });
        expect(returnedListing).toBeTruthy();
        expect(returnedListing.numOfGuests).toBe(3);
    }));
    test('Query listings returns all listings', () => __awaiter(void 0, void 0, void 0, function* () {
        const allListings = yield listingService.queryListings({
            db,
            location: null,
            filter: types_1.ListingsFilter.PRICE_LOW_TO_HIGH,
            limit: 4,
            page: 1,
        });
        expect(allListings).toBeTruthy();
        expect(allListings.total).toBeGreaterThan(1);
        expect(allListings.result).toBeInstanceOf(Array);
        expect(allListings.result[0].price).toBeLessThan(allListings.result[1].price);
    }));
});
