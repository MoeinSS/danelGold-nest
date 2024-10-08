"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UserAgentMiddleware", {
    enumerable: true,
    get: function() {
        return UserAgentMiddleware;
    }
});
const _common = require("@nestjs/common");
const _expressuseragent = /*#__PURE__*/ _interop_require_wildcard(require("express-useragent"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let UserAgentMiddleware = class UserAgentMiddleware {
    use(req, res, next) {
        const userAgentString = req.headers['user-agent'];
        if (!userAgentString) {
            console.error('No User-Agent header found');
            // Handle the case where User-Agent header is not present
            req['userAgent'] = {
                platform: 'Unknown',
                browser: 'Unknown',
                versionBrowser: 'Unknown',
                versionPlatform: 'Unknown',
                ip: req.ip
            };
            return next(); // Proceed to the next middleware or request handler
        }
        try {
            const agent = _expressuseragent.parse(userAgentString);
            req['userAgent'] = {
                platform: agent.os,
                browser: agent.browser,
                versionBrowser: agent.version,
                versionPlatform: agent.osVersion,
                ip: req.ip
            };
        } catch (error) {
            console.error('Error parsing User-Agent:', error);
            req['userAgent'] = {
                platform: 'Unknown',
                browser: 'Unknown',
                versionBrowser: 'Unknown',
                versionPlatform: 'Unknown',
                ip: req.ip
            };
        }
        next();
    }
};
UserAgentMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], UserAgentMiddleware);

//# sourceMappingURL=user-agent.middleware.js.map