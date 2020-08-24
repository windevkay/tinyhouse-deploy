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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const requests_1 = require("./requests");
const crypto_1 = __importDefault(require("crypto"));
class AuthService {
    constructor() {
        //cookie options
        this.cookieOptions = {
            httpOnly: true,
            sameSite: true,
            signed: true,
            secure: process.env.NODE_ENV === 'development' ? false : true,
        };
        /**
         * Query Google for the authenticaiton URL
         * @param none
         */
        this.queryAuthUrl = () => __awaiter(this, void 0, void 0, function* () {
            try {
                return Promise.resolve(requests_1.Google.authUrlRequest);
            }
            catch (error) {
                return Promise.reject(`Failed to query Google Auth Url: ${error}`);
            }
        });
        /**
         * Login via google
         * @param params logininput and database object
         */
        this.mutationLogin = (params) => __awaiter(this, void 0, void 0, function* () {
            const { input, db, res, req } = params;
            try {
                const code = input ? input.code : null;
                //we create a random string for session token
                const token = crypto_1.default.randomBytes(16).toString('hex');
                const viewer = code
                    ? yield this.middlewareLoginViaGoogle(code, token, db, res)
                    : yield this.middlewareLoginViaCookie(token, db, req, res);
                //if no viewer, then return object to show a request was made
                if (!viewer) {
                    return { didRequest: true };
                }
                //if viewer exists, use it to populate Viewer to be returned
                return {
                    _id: viewer._id,
                    token: viewer.token,
                    avatar: viewer.avatar,
                    walletId: viewer.walletId,
                    didRequest: true,
                };
            }
            catch (error) {
                return Promise.reject(`Failed to log in: ${error}`);
            }
        });
        /**
         * Logout
         * @param params response object
         */
        this.mutationLogOut = (params) => {
            const { res } = params;
            try {
                //clear cookie
                res.clearCookie('viewer', this.cookieOptions);
                return { didRequest: true };
            }
            catch (error) {
                throw new Error(`Failed to logout: ${error}`);
            }
        };
        this.middlewareLoginViaCookie = (token, db, req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const updateRes = yield db.users.findOneAndUpdate({ _id: req.signedCookies.viewer }, { $set: { token } }, { returnOriginal: false });
                //assign updated value to viewer
                const viewer = updateRes.value;
                if (!viewer) {
                    res.clearCookie('viewer', this.cookieOptions);
                }
                return Promise.resolve(viewer);
            }
            catch (error) {
                return Promise.reject(error);
            }
        });
        this.middlewareLoginViaGoogle = (code, token, db, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield requests_1.Google.logInRequest(code);
                const { user } = url;
                if (!user) {
                    throw new Error(`Google login error`);
                }
                //get the users names/photo/email lists
                const userNamesList = user.names && user.names.length ? user.names : null;
                const userPhotosList = user.photos && user.photos.length ? user.photos : null;
                const userEmailsList = user.emailAddresses && user.emailAddresses.length ? user.emailAddresses : null;
                //user display name
                const userName = userNamesList ? userNamesList[0].displayName : null;
                //user id
                const userId = userNamesList && userNamesList[0].metadata && userNamesList[0].metadata.source
                    ? userNamesList[0].metadata.source.id
                    : null;
                //user avatar
                const userAvatar = userPhotosList && userPhotosList[0].url ? userPhotosList[0].url : null;
                //user email
                const userEmail = userEmailsList && userEmailsList[0].value ? userEmailsList[0].value : null;
                if (!userId || !userName || !userAvatar || !userEmail) {
                    throw new Error('Google login error');
                }
                //check if user exists in our db and if yes, update user info
                const updateRes = yield db.users.findOneAndUpdate({ _id: userId }, //filter object
                {
                    //update object
                    $set: {
                        name: userName,
                        avatar: userAvatar,
                        contact: userEmail,
                        token,
                    },
                }, 
                //return updated document and not the original one
                { returnOriginal: false });
                //if no existing user, then insert/create a new one
                let viewer = updateRes.value;
                if (!viewer) {
                    const insertResult = yield db.users.insertOne({
                        _id: userId,
                        token,
                        name: userName,
                        avatar: userAvatar,
                        contact: userEmail,
                        income: 0,
                        bookings: [],
                        listings: [],
                    });
                    viewer = insertResult.ops[0];
                }
                //create a cookie called viewer for the user for the response
                res.cookie('viewer', userId, Object.assign(Object.assign({}, this.cookieOptions), { maxAge: 365 * 24 * 60 * 60 * 1000 }));
                return viewer;
            }
            catch (error) {
                return Promise.reject(`Something went wrong: ${error}`);
            }
        });
    }
}
exports.AuthService = AuthService;
