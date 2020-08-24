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
exports.BookingService = void 0;
const mongodb_1 = require("mongodb");
const utils_1 = require("../lib/utils");
const requests_1 = require("./requests");
class BookingService {
    constructor() {
        this.mutationCreateBooking = (params) => __awaiter(this, void 0, void 0, function* () {
            const { input, db, req } = params;
            try {
                const { id, source, checkIn, checkOut } = input;
                //verify a logged in user is making the request
                const viewer = yield utils_1.authorize(db, req);
                if (!viewer) {
                    throw new Error('viewer cannot be found');
                }
                //find listing document that is being booked
                const listing = yield db.listings.findOne({
                    _id: new mongodb_1.ObjectID(id),
                });
                if (!listing) {
                    throw new Error('listing cant be found');
                }
                //check that viewer is not booking their own listing
                if (listing.host === viewer._id) {
                    throw new Error('viewer cant book own listing');
                }
                //check that checkout is not before checkin
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                if (checkOutDate < checkInDate) {
                    throw new Error('checkout date cant be before checkin date');
                }
                //create a new bookingsIndex for listing being booked
                const bookingsIndex = this.middlewareResolveBookingsIndex(listing.bookingsIndex, checkIn, checkOut);
                //get total price to charge
                const totalPrice = listing.price * ((checkOutDate.getTime() - checkInDate.getTime()) / 86400000 + 1);
                //get user document of host of listing
                const host = yield db.users.findOne({
                    _id: listing.host,
                });
                if (!host || !host.walletId) {
                    throw new Error('host cannot be found or isnt connected with Stripe');
                }
                //create stripe charge on behalf of host
                yield requests_1.Stripe.charge(totalPrice, source, host.walletId);
                //insert a new booking document to bookings collection
                const insertRes = yield db.bookings.insertOne({
                    _id: new mongodb_1.ObjectID(),
                    listing: listing._id,
                    tenant: viewer._id,
                    checkIn,
                    checkOut,
                });
                const insertedBooking = insertRes.ops[0];
                //update user document of host to increment income
                yield db.users.updateOne({
                    _id: host._id,
                }, {
                    $inc: { income: totalPrice },
                });
                //update bookings field of tenant
                yield db.users.updateOne({
                    _id: viewer._id,
                }, {
                    $push: { bookings: insertedBooking._id },
                });
                //update bookings field of listing document
                yield db.listings.updateOne({
                    _id: listing._id,
                }, {
                    $set: { bookingsIndex },
                    $push: { bookings: insertedBooking._id },
                });
                //return newly inserted booking
                return Promise.resolve(insertedBooking);
            }
            catch (error) {
                return Promise.reject(`Failed to create booking: ${error}`);
            }
        });
        this.middlewareResolveBookingsIndex = (bookingsIndex, checkInDate, checkOutDate) => {
            let dateCursor = new Date(checkInDate);
            const checkOut = new Date(checkOutDate);
            const newBookingsIndex = Object.assign({}, bookingsIndex);
            while (dateCursor <= checkOut) {
                const y = dateCursor.getUTCFullYear();
                const m = dateCursor.getUTCMonth();
                const d = dateCursor.getUTCDate();
                if (!newBookingsIndex[y]) {
                    newBookingsIndex[y] = {};
                }
                if (!newBookingsIndex[y][m]) {
                    newBookingsIndex[y][m] = {};
                }
                if (!newBookingsIndex[y][m][d]) {
                    newBookingsIndex[y][m][d] = true;
                }
                else {
                    throw new Error('selected dates cant overlap dates that have already been booked');
                }
                dateCursor = new Date(dateCursor.getTime() + 86400000);
            }
            return newBookingsIndex;
        };
    }
}
exports.BookingService = BookingService;
