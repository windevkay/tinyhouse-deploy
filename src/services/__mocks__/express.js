"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.response = void 0;
const mock_express_request_1 = __importDefault(require("mock-express-request"));
const mock_express_response_1 = __importDefault(require("mock-express-response"));
//req and res mocks
exports.response = new mock_express_response_1.default();
exports.request = new mock_express_request_1.default({
    signedCookies: {
        viewer: '5d378db94e84753160e08b55',
    },
    //functions
    get: (csrf) => {
        if (csrf === 'X-CSRF-TOKEN') {
            return 'f89f55e74c080778dfc9eab8cd9282e8';
        }
    },
});
