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
exports.UserService = void 0;
const requests_1 = require("./requests");
const utils_1 = require("../lib/utils");
class UserService {
    constructor() {
        /**
         * Query for a single user using their id
         * @param params user id, db object and request object
         */
        this.queryUser = (params) => __awaiter(this, void 0, void 0, function* () {
            const { id, db, req } = params;
            try {
                const user = yield db.users.findOne({ _id: id });
                if (!user) {
                    throw new Error('User was not found');
                }
                //check if user making the query is authorized to see certain info
                const viewer = yield utils_1.authorize(db, req);
                if (viewer && viewer._id === user._id) {
                    user.authorized = true;
                }
                return Promise.resolve(user);
            }
            catch (error) {
                return Promise.reject(`Failed to query user: ${error}`);
            }
        });
        /**
         * Connect to a users stripe account and get their account ID
         * @param params stripe code, db object, request object
         */
        this.mutationConnectStripe = (params) => __awaiter(this, void 0, void 0, function* () {
            const { input, db, req } = params;
            try {
                const { code } = input;
                let viewer = yield utils_1.authorize(db, req);
                if (!viewer) {
                    throw new Error('viewer cannot be found or not authorized');
                }
                //get stripe details
                const wallet = yield requests_1.Stripe.connect(code);
                if (!wallet) {
                    throw new Error('Stripe grant error');
                }
                //update user wallet id with the stripe user id
                const updateRes = yield db.users.findOneAndUpdate({ _id: viewer._id }, { $set: { walletId: wallet.stripe_user_id } }, { returnOriginal: false });
                if (!updateRes.value) {
                    throw new Error('viewer could not be updated');
                }
                viewer = updateRes.value;
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (error) {
                return Promise.reject(`Failed to connect to Stripe: ${error}`);
            }
        });
        /**
         * Disconnect stripe
         * @param params db object and request object
         */
        this.mutationDisconnectStripe = (params) => __awaiter(this, void 0, void 0, function* () {
            const { db, req } = params;
            try {
                let viewer = yield utils_1.authorize(db, req);
                if (!viewer) {
                    throw new Error('viewer cannot be found or not authorized');
                }
                const updateRes = yield db.users.findOneAndUpdate({ _id: viewer._id }, { $set: { walletId: undefined } }, { returnOriginal: false });
                if (!updateRes.value) {
                    throw new Error('viewer could not be updated');
                }
                viewer = updateRes.value;
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (error) {
                return Promise.reject(`Failed to disconnect from Stripe: ${error}`);
            }
        });
    }
}
exports.UserService = UserService;
