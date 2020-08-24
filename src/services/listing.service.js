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
exports.ListingService = void 0;
const mongodb_1 = require("mongodb");
const types_1 = require("../lib/types");
const utils_1 = require("../lib/utils");
const requests_1 = require("./requests");
class ListingService {
    constructor() {
        /**
         * Mutation to create a new listing
         * @param params listing input, db object, request object
         */
        this.mutationHostListing = (params) => __awaiter(this, void 0, void 0, function* () {
            const { input, db, req } = params;
            try {
                this.middlewareVerifyHostListingInput(input);
                const viewer = yield utils_1.authorize(db, req);
                if (!viewer) {
                    throw new Error('Viewer cannot be found');
                }
                const { country, admin, city } = yield requests_1.Google.geocode(input.address);
                if (!country || !admin || !city) {
                    throw new Error('Invalid address input');
                }
                //upload image to cloud
                const imageUrl = yield requests_1.Cloudinary.upload(input.image);
                //if all is well at this point, then create the listing
                const insertResult = yield db.listings.insertOne(Object.assign(Object.assign({ _id: new mongodb_1.ObjectID() }, input), { image: imageUrl, bookings: [], bookingsIndex: {}, country,
                    admin,
                    city, host: viewer._id }));
                //associate the listing with the users listings
                const insertedListing = insertResult.ops[0];
                yield db.users.updateOne({ _id: viewer._id }, { $push: { listings: insertedListing._id } });
                return Promise.resolve(insertedListing);
            }
            catch (error) {
                return Promise.reject(`Failed to create listing: ${error}`);
            }
        });
        /**
         * Query for a single listing by id
         * @param params listing id, db object
         */
        this.queryListing = (params) => __awaiter(this, void 0, void 0, function* () {
            const { id, db, req } = params;
            try {
                const listing = yield db.listings.findOne({ _id: new mongodb_1.ObjectID(id) });
                if (!listing) {
                    throw new Error('Listing cannot be found');
                }
                const viewer = yield utils_1.authorize(db, req);
                if (viewer && viewer._id === listing.host) {
                    listing.authorized = true;
                }
                return Promise.resolve(listing);
            }
            catch (error) {
                return Promise.reject(`Failed to query listing: ${error}`);
            }
        });
        /**
         * Query to return all available listings
         * @param params db object, price filter, pagination limit, page number
         */
        this.queryListings = (params) => __awaiter(this, void 0, void 0, function* () {
            const { db, location, filter, limit, page } = params;
            try {
                const query = {};
                const data = { region: null, total: 0, result: [] };
                if (location) {
                    const { country, admin, city } = yield requests_1.Google.geocode(location);
                    if (city)
                        query.city = city;
                    if (admin)
                        query.admin = admin;
                    if (country) {
                        query.country = country;
                    }
                    else {
                        throw new Error('No country found');
                    }
                    //create the region string
                    const cityText = city ? `${city}, ` : '';
                    const adminText = admin ? `${admin}, ` : '';
                    data.region = `${cityText}${adminText}${country}`;
                }
                //if query is empty, all listings will be returned, else it will return based on geocode result
                let cursor = yield db.listings.find(query);
                if (filter && filter === types_1.ListingsFilter.PRICE_LOW_TO_HIGH) {
                    //mongo sort method - 1 for ascending, minus 1 for descending
                    cursor = cursor.sort({ price: 1 });
                }
                if (filter && filter === types_1.ListingsFilter.PRICE_HIGH_TO_LOW) {
                    cursor = cursor.sort({ price: -1 });
                }
                cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
                cursor = cursor.limit(limit);
                data.total = yield cursor.count();
                data.result = yield cursor.toArray();
                return Promise.resolve(data);
            }
            catch (error) {
                return Promise.reject(`Failed to query listings: ${error}`);
            }
        });
        this.middlewareVerifyHostListingInput = (listingInput) => {
            const { title, description, type, price } = listingInput;
            if (title.length > 100) {
                throw new Error('Listing title must be under 100 characters');
            }
            if (description.length > 5000) {
                throw new Error('Listing description must be under 5000 characters');
            }
            if (type !== types_1.ListingType.Apartment && type !== types_1.ListingType.House) {
                throw new Error('Listing type must be either an apartment or house');
            }
            if (price <= 0) {
                throw new Error('Listing price must be greater than 0');
            }
        };
    }
}
exports.ListingService = ListingService;
