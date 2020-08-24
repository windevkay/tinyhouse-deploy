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
exports.resolvers = void 0;
const services_1 = require("../services");
const authService = new services_1.AuthService();
const userService = new services_1.UserService();
const listingService = new services_1.ListingService();
const bookingService = new services_1.BookingService();
exports.resolvers = {
    Query: {
        //AUTH
        authUrl: () => __awaiter(void 0, void 0, void 0, function* () { return yield authService.queryAuthUrl(); }),
        //USER
        user: (_root, { id }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () { return yield userService.queryUser({ id, db, req }); }),
        //LISTING
        listing: (_root, { id }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () { return yield listingService.queryListing({ id, db, req }); }),
        //LISTINGS
        listings: (_root, { location, filter, limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () { return yield listingService.queryListings({ db, location, filter, limit, page }); }),
    },
    Mutation: {
        //AUTH
        logIn: (_root, { input }, { db, req, res }) => __awaiter(void 0, void 0, void 0, function* () { return yield authService.mutationLogin({ input, db, res, req }); }),
        logOut: (_root, _args, { res }) => authService.mutationLogOut({ res }),
        //STRIPE
        connectStripe: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () { return yield userService.mutationConnectStripe({ input, db, req }); }),
        disconnectStripe: (_root, _args, { db, req }) => __awaiter(void 0, void 0, void 0, function* () { return yield userService.mutationDisconnectStripe({ db, req }); }),
        //LISTINGS
        hostListing: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () { return yield listingService.mutationHostListing({ input, db, req }); }),
        //BOOKINGS
        createBooking: (_root, { input }, { db, req }) => __awaiter(void 0, void 0, void 0, function* () { return yield bookingService.mutationCreateBooking({ input, db, req }); }),
    },
    /**
     * Below we resolve some typescript types properties to typedef fields
     */
    Viewer: {
        id: (viewer) => {
            return viewer._id;
        },
        hasWallet: (viewer) => {
            return viewer.walletId ? true : undefined;
        },
    },
    User: {
        id: (user) => {
            return user._id;
        },
        hasWallet: (user) => {
            return Boolean(user.walletId);
        },
        income: (user) => {
            return user.authorized ? user.income : null;
        },
        bookings: (user, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!user.authorized) {
                    //if user isnt authroized, we want this field to be null
                    //only an authorized user should see their own bookings
                    return null;
                }
                const data = { total: 0, result: [] };
                //find the user bookings using mongo, and use the cursor to set pagination options
                let cursor = yield db.bookings.find({
                    _id: { $in: user.bookings },
                });
                cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
                cursor = cursor.limit(limit);
                data.total = yield cursor.count();
                data.result = yield cursor.toArray();
                return Promise.resolve(data);
            }
            catch (error) {
                return Promise.reject(`Failed to query user bookings: ${error}`);
            }
        }),
        listings: (user, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const data = { total: 0, result: [] };
                let cursor = yield db.listings.find({
                    _id: { $in: user.listings },
                });
                cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
                cursor = cursor.limit(limit);
                data.total = yield cursor.count();
                data.result = yield cursor.toArray();
                return Promise.resolve(data);
            }
            catch (error) {
                return Promise.reject(`Failed to query user listings: ${error}`);
            }
        }),
    },
    Listing: {
        id: (listing) => {
            return listing._id.toString();
        },
        host: (listing, _args, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            const host = yield db.users.findOne({ _id: listing.host });
            if (!host) {
                throw new Error('Host for listing cannot be found');
            }
            return host;
        }),
        bookingsIndex: (listing) => {
            return JSON.stringify(listing.bookingsIndex);
        },
        bookings: (listing, { limit, page }, { db }) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (!listing.authorized) {
                    return null;
                }
                const data = { total: 0, result: [] };
                let cursor = yield db.bookings.find({
                    _id: { $in: listing.bookings },
                });
                cursor = cursor.skip(page > 0 ? (page - 1) * limit : 0);
                cursor = cursor.limit(limit);
                data.total = yield cursor.count();
                data.result = yield cursor.toArray();
                return Promise.resolve(data);
            }
            catch (error) {
                return Promise.reject(`Failed to query listing bookings: ${error}`);
            }
        }),
    },
    Booking: {
        id: (booking) => {
            return booking._id.toString();
        },
        listing: (booking, _args, { db }) => {
            return db.listings.findOne({ _id: booking.listing });
        },
        tenant: (booking, _args, { db }) => {
            return db.users.findOne({ _id: booking.tenant });
        },
    },
};
